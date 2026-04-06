"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, Clock, UserPlus, AlertTriangle, Check } from "lucide-react";
import type { TriageTowerItem, TriageTowerResult } from "@/types";

interface TriageTowerProps {
  items: TriageTowerItem[];
  onComplete: (result: TriageTowerResult) => void;
}

type Bin = "doNow" | "doNext" | "delegate";

const BIN_META: Record<Bin, { label: string; color: string; icon: typeof Zap }> = {
  doNow: { label: "Do Now", color: "var(--accent)", icon: Zap },
  doNext: { label: "Do Next", color: "var(--warning)", icon: Clock },
  delegate: { label: "Delegate", color: "var(--text-secondary)", icon: UserPlus },
};

export function TriageTower({ items, onComplete }: TriageTowerProps) {
  const regularItems = items.filter((i) => !i.isInterrupt);
  const interruptItem = items.find((i) => i.isInterrupt) ?? null;

  const [revealedCount, setRevealedCount] = useState(0);
  const [placements, setPlacements] = useState<Record<string, Bin>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [revisions, setRevisions] = useState(0);

  // Interrupt phase
  const [interruptPhase, setInterruptPhase] = useState(false);
  const [interruptTimer, setInterruptTimer] = useState(12);
  const [bumpItemId, setBumpItemId] = useState<string | null>(null);
  const [interruptResolved, setInterruptResolved] = useState(false);

  const startTime = useRef(Date.now());
  const interruptTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reveal items one at a time
  useEffect(() => {
    if (revealedCount < regularItems.length) {
      const timer = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, regularItems.length]);

  // Check if all regular items are placed → trigger interrupt
  const allRegularPlaced =
    regularItems.length > 0 &&
    regularItems.every((item) => placements[item.id] !== undefined);

  useEffect(() => {
    if (allRegularPlaced && interruptItem && !interruptPhase && !interruptResolved) {
      setInterruptPhase(true);
      setInterruptTimer(12);
    }
  }, [allRegularPlaced, interruptItem, interruptPhase, interruptResolved]);

  // Interrupt countdown
  useEffect(() => {
    if (interruptPhase && !interruptResolved) {
      interruptTimerRef.current = setInterval(() => {
        setInterruptTimer((t) => {
          if (t <= 1) {
            // Time expired — auto-resolve: bump first doNow item
            if (interruptTimerRef.current) clearInterval(interruptTimerRef.current);
            autoResolveBump();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (interruptTimerRef.current) clearInterval(interruptTimerRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interruptPhase, interruptResolved]);

  const autoResolveBump = useCallback(() => {
    const doNowItems = regularItems.filter((i) => placements[i.id] === "doNow");
    if (doNowItems.length > 0) {
      const bumped = doNowItems[0];
      setPlacements((prev) => ({
        ...prev,
        [bumped.id]: "doNext",
        [interruptItem!.id]: "doNow",
      }));
      setBumpItemId(bumped.id);
    } else {
      // No doNow items, just place interrupt in doNow
      setPlacements((prev) => ({
        ...prev,
        [interruptItem!.id]: "doNow",
      }));
    }
    setInterruptResolved(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, regularItems, interruptItem]);

  // Revealed but unplaced items
  const revealedItems = regularItems.slice(0, revealedCount);
  const unplacedItems = revealedItems.filter((i) => placements[i.id] === undefined);

  function handleItemClick(itemId: string) {
    if (interruptPhase && !interruptResolved) return; // Block during interrupt
    setActiveItemId(activeItemId === itemId ? null : itemId);
  }

  function handleBinPlace(bin: Bin) {
    if (!activeItemId) return;
    const wasPlaced = placements[activeItemId] !== undefined;
    setPlacements((prev) => ({ ...prev, [activeItemId]: bin }));
    if (wasPlaced) setRevisions((r) => r + 1);
    setActiveItemId(null);
  }

  function handleBinItemClick(itemId: string) {
    if (interruptPhase && !interruptResolved) {
      // During interrupt: clicking a doNow item bumps it
      if (placements[itemId] === "doNow") {
        if (interruptTimerRef.current) clearInterval(interruptTimerRef.current);
        setPlacements((prev) => ({
          ...prev,
          [itemId]: "doNext",
          [interruptItem!.id]: "doNow",
        }));
        setBumpItemId(itemId);
        setInterruptResolved(true);
      }
      return;
    }
    // Normal mode: select item from bin to re-place
    setActiveItemId(activeItemId === itemId ? null : itemId);
  }

  function handleConfirm() {
    const doNowItems = regularItems.filter((i) => placements[i.id] === "doNow");
    onComplete({
      placements: [...regularItems, ...(interruptItem ? [interruptItem] : [])]
        .filter((i) => placements[i.id] !== undefined)
        .map((i) => ({ itemId: i.id, bin: placements[i.id] })),
      interruptBump: bumpItemId
        ? { bumpedItemId: bumpItemId, newBin: "doNext" }
        : null,
      timeMs: Date.now() - startTime.current,
      revisions,
    });
  }

  const allPlaced =
    allRegularPlaced &&
    (!interruptItem || placements[interruptItem.id] !== undefined);

  return (
    <div className="max-w-3xl mx-auto">
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading, inherit)" }}
      >
        Triage Tower
      </h2>
      <p className="mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Assign each task to the right priority bin. Click a task, then pick a bin.
      </p>

      {/* Incoming items queue */}
      <div className="mb-8">
        <h3
          className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <AlertTriangle size={14} aria-hidden="true" />
          Incoming Tasks
        </h3>

        {unplacedItems.length === 0 && !interruptPhase && !allRegularPlaced && (
          <div
            className="glass-card px-4 py-6 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Tasks arriving...
          </div>
        )}

        {unplacedItems.length === 0 && allRegularPlaced && !interruptPhase && !interruptItem && (
          <div
            className="glass-card px-4 py-6 text-center text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            All tasks placed!
          </div>
        )}

        <div className="space-y-2">
          {unplacedItems.map((item) => {
            const isActive = activeItemId === item.id;
            return (
              <div key={item.id}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  className="glass-card w-full px-4 py-3 text-left cursor-pointer"
                  style={{
                    borderLeft: `4px solid var(--accent)`,
                    borderColor: isActive ? "var(--accent)" : undefined,
                    boxShadow: isActive ? "0 0 0 2px var(--accent-glow)" : undefined,
                    transition: `all var(--transition-fast)`,
                    animation: "fadeSlideIn 0.4s var(--ease-spring) both",
                  }}
                >
                  <span
                    className="font-semibold text-base block"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="text-sm mt-0.5 block"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {item.description}
                  </span>
                </button>
                {/* Bin buttons appear when item is active */}
                {isActive && (
                  <div className="flex gap-2 mt-2 ml-4">
                    {(Object.keys(BIN_META) as Bin[]).map((bin) => {
                      const meta = BIN_META[bin];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={bin}
                          onClick={() => handleBinPlace(bin)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
                          style={{
                            borderRadius: "var(--radius-full)",
                            backgroundColor: meta.color,
                            color: "var(--bg-base)",
                            transition: `transform var(--transition-fast), box-shadow var(--transition-fast)`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = `0 0 12px ${meta.color}`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <Icon size={14} aria-hidden="true" />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Interrupt item */}
        {interruptPhase && interruptItem && !interruptResolved && (
          <div
            className="glass-card px-4 py-4 mt-4"
            style={{
              borderLeft: "4px solid var(--error)",
              borderColor: "var(--error)",
              animation: "pulse 1.5s ease-in-out infinite, fadeSlideIn 0.4s var(--ease-spring) both",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="badge px-2 py-0.5 text-xs font-bold uppercase"
                style={{
                  backgroundColor: "var(--error)",
                  color: "var(--bg-base)",
                  borderRadius: "var(--radius-sm)",
                  animation: "pulse 1s ease-in-out infinite",
                }}
              >
                URGENT
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--error)" }}
              >
                {interruptTimer}s remaining
              </span>
              {/* Mini timer bar */}
              <div
                className="flex-1 h-1 ml-2"
                style={{
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--border-subtle)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(interruptTimer / 10) * 100}%`,
                    backgroundColor: interruptTimer > 5 ? "var(--error)" : "var(--warning)",
                    borderRadius: "var(--radius-full)",
                    transition: "width 1s linear, background-color 0.3s",
                  }}
                />
              </div>
            </div>
            <span
              className="font-semibold text-base block"
              style={{ color: "var(--text-primary)" }}
            >
              {interruptItem.label}
            </span>
            <span
              className="text-sm mt-0.5 block"
              style={{ color: "var(--text-secondary)" }}
            >
              {interruptItem.description}
            </span>
            <p
              className="text-xs mt-3 font-medium"
              style={{ color: "var(--warning)" }}
            >
              Click an item in &quot;Do Now&quot; to bump it and make room for this urgent task.
            </p>
          </div>
        )}

        {interruptResolved && interruptItem && (
          <div
            className="glass-card px-4 py-3 mt-4 flex items-center gap-2"
            style={{
              borderLeft: "4px solid var(--success)",
              backgroundColor: "var(--success-surface)",
            }}
          >
            <Check size={16} style={{ color: "var(--success)" }} aria-hidden="true" />
            <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
              Interrupt resolved — {interruptItem.label} placed in Do Now
            </span>
          </div>
        )}
      </div>

      {/* 3 Bin Columns */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(Object.keys(BIN_META) as Bin[]).map((bin) => {
          const meta = BIN_META[bin];
          const Icon = meta.icon;
          const binItems = items.filter((i) => placements[i.id] === bin);
          const isDropTarget =
            activeItemId !== null &&
            !interruptPhase;

          return (
            <div
              key={bin}
              className="flex flex-col"
              style={{
                borderRadius: "var(--radius-lg)",
                border: `2px solid ${isDropTarget ? meta.color : "var(--border-subtle)"}`,
                backgroundColor: isDropTarget ? "var(--bg-elevated)" : "var(--bg-surface-solid)",
                transition: `border-color var(--transition-fast), background-color var(--transition-fast)`,
                minHeight: 160,
              }}
            >
              {/* Bin header */}
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{
                  borderBottom: `1px solid var(--border-subtle)`,
                  color: meta.color,
                }}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {meta.label}
                </span>
                <span
                  className="ml-auto text-xs font-medium"
                  style={{
                    backgroundColor: meta.color,
                    color: "var(--bg-base)",
                    borderRadius: "var(--radius-full)",
                    padding: "1px 8px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {binItems.length}
                </span>
              </div>

              {/* Bin items */}
              <div className="flex-1 p-2 space-y-1.5">
                {binItems.length === 0 && (
                  <div
                    className="text-xs text-center py-4"
                    style={{
                      color: "var(--text-muted)",
                      border: `1px dashed var(--border-default)`,
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    Drop tasks here
                  </div>
                )}
                {binItems.map((item) => {
                  const isActive = activeItemId === item.id;
                  const isInterruptHighlight =
                    interruptPhase && !interruptResolved && bin === "doNow";
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleBinItemClick(item.id)}
                      className="w-full px-2.5 py-1.5 text-left text-xs font-medium flex items-center gap-1.5"
                      style={{
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: isActive
                          ? "var(--accent-surface)"
                          : item.isInterrupt
                            ? "var(--error-surface)"
                            : "var(--bg-input)",
                        color: item.isInterrupt
                          ? "var(--error)"
                          : "var(--text-primary)",
                        border: isActive
                          ? "1px solid var(--accent)"
                          : isInterruptHighlight
                            ? "1px solid var(--warning)"
                            : "1px solid transparent",
                        cursor: isInterruptHighlight || !interruptPhase ? "pointer" : "default",
                        transition: `all var(--transition-fast)`,
                      }}
                    >
                      {item.isInterrupt && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "var(--radius-full)",
                            backgroundColor: "var(--error)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Bin click-target during active selection */}
              {isDropTarget && (
                <button
                  onClick={() => handleBinPlace(bin)}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-center"
                  style={{
                    borderTop: `1px solid var(--border-subtle)`,
                    color: meta.color,
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    transition: `background-color var(--transition-fast)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Place Here
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm button */}
      {allPlaced && (
        <button
          onClick={handleConfirm}
          className="btn-cta w-full py-3 text-base font-bold"
          style={{
            borderRadius: "var(--radius-full)",
            animation: "fadeSlideIn 0.3s var(--ease-spring) both",
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <Check size={18} aria-hidden="true" />
            Confirm Triage
          </span>
        </button>
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
