"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowRight, CheckCircle, icons } from "lucide-react";
import type { ScenarioTree, ScenarioOption, ScenarioResource } from "@/types";

interface BranchingScenarioProps {
  tree: ScenarioTree;
  onComplete: (path: { nodeId: string; choiceId: string; timeMs: number }[]) => void;
}

type Phase = "question" | "consequence" | "reflection";

/* ------------------------------------------------------------------ */
/*  Resource bar sub-component                                        */
/* ------------------------------------------------------------------ */

function ResourceBar({
  resource,
  animatedValue,
}: {
  resource: ScenarioResource;
  animatedValue: number;
}) {
  const pct = resource.max > 0 ? (animatedValue / resource.max) * 100 : 0;
  const clampedPct = Math.max(0, Math.min(100, pct));

  const barColor =
    clampedPct > 60
      ? "var(--success)"
      : clampedPct >= 30
        ? "var(--warning)"
        : "var(--error)";

  // Resolve the lucide icon by name (PascalCase key in `icons`)
  const IconComponent = (icons as Record<string, React.ComponentType<{ size?: number }>>)[
    resource.icon
  ] ?? null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
      {IconComponent && (
        <IconComponent size={16} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginBottom: 2,
            whiteSpace: "nowrap",
          }}
        >
          {resource.label}
        </div>
        <div
          style={{
            height: 6,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--border-subtle)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${clampedPct}%`,
              height: "100%",
              borderRadius: "var(--radius-full)",
              backgroundColor: barColor,
              transition: "width 600ms ease, background-color 400ms ease",
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: barColor,
          minWidth: 20,
          textAlign: "right",
        }}
      >
        {Math.round(animatedValue)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Resource panel                                                    */
/* ------------------------------------------------------------------ */

function ResourcePanel({
  definitions,
  values,
}: {
  definitions: ScenarioResource[];
  values: Record<string, number>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        padding: "12px 16px",
        marginBottom: 16,
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {definitions.map((res) => (
        <ResourceBar
          key={res.label}
          resource={res}
          animatedValue={values[res.label] ?? res.value}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export function BranchingScenario({ tree, onComplete }: BranchingScenarioProps) {
  const [currentNodeId, setCurrentNodeId] = useState(tree.rootNodeId);
  const [phase, setPhase] = useState<Phase>("question");
  const [selectedOption, setSelectedOption] = useState<ScenarioOption | null>(null);
  const [path, setPath] = useState<{ nodeId: string; choiceId: string; timeMs: number }[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const nodeStartTime = useRef(Date.now());

  // --- Resource tracking ---
  const rootNode = tree.nodes[tree.rootNodeId];
  const initialResources = useMemo(() => {
    const map: Record<string, number> = {};
    if (rootNode?.resources) {
      for (const r of rootNode.resources) {
        map[r.label] = r.value;
      }
    }
    return map;
  }, [rootNode]);

  const [currentResources, setCurrentResources] = useState<Record<string, number>>(initialResources);

  // The resource definitions (label/max/icon) come from the first node that defines them, or the root.
  const resourceDefs = useMemo(() => {
    // Walk nodes to find the first with resources defined
    for (const nid of Object.keys(tree.nodes)) {
      if (tree.nodes[nid].resources && tree.nodes[nid].resources!.length > 0) {
        return tree.nodes[nid].resources!;
      }
    }
    return [];
  }, [tree.nodes]);

  const hasResources = resourceDefs.length > 0;

  // --- Reflection state ---
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);

  const currentNode = tree.nodes[currentNodeId];

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

  // Apply resource changes when navigating to a new node
  useEffect(() => {
    if (!currentNode?.resourceChanges) return;
    setCurrentResources((prev) => {
      const next = { ...prev };
      for (const [label, delta] of Object.entries(currentNode.resourceChanges!)) {
        if (label in next) {
          // Clamp to [0, max]
          const def = resourceDefs.find((d) => d.label === label);
          const max = def?.max ?? Infinity;
          next[label] = Math.max(0, Math.min(max, (next[label] ?? 0) + delta));
        }
      }
      return next;
    });
  }, [currentNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine initial phase based on node type
  useEffect(() => {
    if (currentNode?.reflection && !currentNode?.options) {
      setPhase("reflection");
    }
  }, [currentNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoice(option: ScenarioOption) {
    const elapsed = Date.now() - nodeStartTime.current;
    const newPath = [...path, { nodeId: currentNodeId, choiceId: option.id, timeMs: elapsed }];
    setPath(newPath);
    setSelectedOption(option);

    // Fade out then switch to consequence
    setTransitioning(true);
    setTimeout(() => {
      setPhase("consequence");
      setTransitioning(false);
    }, 200);
  }

  function handleContinue() {
    if (!selectedOption) return;
    if (selectedOption.nextNodeId && tree.nodes[selectedOption.nextNodeId]) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentNodeId(selectedOption.nextNodeId!);
        const nextNode = tree.nodes[selectedOption.nextNodeId!];
        // Set phase based on node type
        if (nextNode?.reflection && !nextNode?.options) {
          setPhase("reflection");
        } else {
          setPhase("question");
        }
        setSelectedOption(null);
        setSelectedAnchorId(null);
        nodeStartTime.current = Date.now();
        setTransitioning(false);
      }, 200);
    } else {
      onComplete(path);
    }
  }

  function handleReflectionAnchor(anchorId: string) {
    setSelectedAnchorId(anchorId);
    const elapsed = Date.now() - nodeStartTime.current;
    const finalPath = [...path, { nodeId: currentNodeId, choiceId: anchorId, timeMs: elapsed }];
    // Small delay so the user sees the selection highlight before completing
    setTimeout(() => {
      onComplete(finalPath);
    }, 400);
  }

  if (!currentNode) { onComplete(path); return null; }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Resource Panel */}
      {hasResources && (
        <ResourcePanel definitions={resourceDefs} values={currentResources} />
      )}

      <div
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(8px)" : "translateY(0)",
          transition: `opacity var(--transition-base), transform var(--transition-base)`,
        }}
      >
        {phase === "question" && (
          <>
            {/* Scenario text card with top accent border */}
            <div
              className="glass-card p-6 mb-6"
              style={{
                borderTop: "4px solid var(--accent)",
              }}
            >
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {currentNode.text}
              </p>
            </div>

            {/* Option buttons */}
            <div className="space-y-3">
              {currentNode.options?.map((option, i) => (
                <button
                  key={option.id}
                  onClick={() => handleChoice(option)}
                  className="glass-card w-full flex items-center gap-4 px-4 py-4 text-left cursor-pointer"
                  style={{
                    transition: `background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-surface)";
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "";
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.transform = "";
                  }}
                >
                  {/* Letter badge */}
                  <span
                    className="flex items-center justify-center w-9 h-9 text-sm font-bold shrink-0"
                    style={{
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--accent-surface)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-glow)",
                    }}
                  >
                    {optionLetters[i] || option.label}
                  </span>
                  <span className="text-base" style={{ color: "var(--text-primary)" }}>
                    {option.text}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "consequence" && selectedOption && (
          <>
            {/* Consequence card with warning accent */}
            <div
              className="glass-card p-6 mb-6"
              style={{
                backgroundColor: "var(--warning-surface)",
                borderLeft: "4px solid var(--warning)",
              }}
            >
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--warning)" }}
              >
                What happened:
              </p>
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {selectedOption.consequence}
              </p>
            </div>

            {/* Continue / Finish button */}
            {selectedOption.nextNodeId ? (
              <button
                onClick={handleContinue}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base font-bold"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Continue
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="btn-cta w-full flex items-center justify-center gap-2 py-3 text-base font-bold"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <CheckCircle size={18} aria-hidden="true" />
                Finish Scenario
              </button>
            )}
          </>
        )}

        {phase === "reflection" && currentNode.reflection && (
          <>
            {/* Reflection prompt card */}
            <div
              className="glass-card p-6 mb-6"
              style={{
                backgroundColor: "var(--accent-surface)",
                borderTop: "4px solid var(--accent)",
              }}
            >
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
                {currentNode.reflection.prompt}
              </p>
            </div>

            {/* Anchor buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              {currentNode.reflection.anchors.map((anchor) => {
                const isSelected = selectedAnchorId === anchor.id;
                return (
                  <button
                    key={anchor.id}
                    onClick={() => handleReflectionAnchor(anchor.id)}
                    className={isSelected ? "btn-primary" : "btn-ghost"}
                    disabled={selectedAnchorId !== null}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      cursor: selectedAnchorId !== null ? "default" : "pointer",
                      opacity: selectedAnchorId !== null && !isSelected ? 0.5 : 1,
                      transition:
                        "opacity 300ms ease, background-color 200ms ease, border-color 200ms ease, transform 200ms ease",
                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {anchor.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
