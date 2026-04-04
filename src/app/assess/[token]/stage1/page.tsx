"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TriageTower } from "@/components/games/TriageTower";
import { TradeOffTiles } from "@/components/games/TradeOffTiles";
import { SignalSort } from "@/components/games/SignalSort";
import { ResourceRoulette } from "@/components/games/ResourceRoulette";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import { StageTransition } from "@/components/ui/StageTransition";
import { Sparkles, AlertCircle } from "lucide-react";
import type {
  BehavioralSignal,
  Stage1Result,
  TriageTowerItem,
  TradeOffPair,
  SignalSortMessage,
  ResourceRouletteCard,
  TriageTowerResult,
  TradeOffTilesResult,
  SignalSortResult,
  ResourceRouletteResult,
} from "@/types";

type GameType = "triage-tower" | "trade-off-tiles" | "signal-sort" | "resource-roulette";

interface ScenarioData {
  id: string;
  tree: {
    type: GameType;
    items?: TriageTowerItem[];
    pairs?: TradeOffPair[];
    messages?: SignalSortMessage[];
    cards?: ResourceRouletteCard[];
    totalTokens?: number;
    curveball?: { text: string; affectedCardId: string };
  };
  scoringRubric: Record<string, unknown>;
}

const GAME_ORDER: GameType[] = [
  "triage-tower",
  "trade-off-tiles",
  "signal-sort",
  "resource-roulette",
];

export default function Stage1Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [result, setResult] = useState<Partial<Stage1Result>>({});

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const res = await fetch("/api/admin/scenarios?stage=1&type=core");
        if (!res.ok) throw new Error("Failed to load scenarios");
        const data: ScenarioData[] = await res.json();
        // Sort by game order
        data.sort((a, b) => {
          const aIdx = GAME_ORDER.indexOf(a.tree.type);
          const bIdx = GAME_ORDER.indexOf(b.tree.type);
          return aIdx - bIdx;
        });
        setScenarios(data);
      } catch {
        setError("Failed to load assessment. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, []);

  const saveProgress = useCallback(
    async (data: Partial<Stage1Result>) => {
      try {
        await fetch("/api/assess/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, stage: 1, data }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [token],
  );

  const handleTimerExpire = useCallback(() => {
    // Auto-save whatever we have and advance
    saveProgress({ ...result, signals });
    setShowTransition(true);
  }, [result, signals, saveProgress]);

  function handleTriageTowerComplete(gameResult: TriageTowerResult) {
    const updated = { ...result, triageTower: gameResult };
    setResult(updated);
    saveProgress(updated);
    signals.push({ event: "triage-tower-complete", timestamp: Date.now(), data: gameResult as unknown as Record<string, unknown> });
    setCurrentGameIndex(1);
  }

  function handleTradeOffComplete(gameResult: TradeOffTilesResult) {
    const updated = { ...result, tradeOffTiles: gameResult };
    setResult(updated);
    saveProgress(updated);
    signals.push({ event: "trade-off-tiles-complete", timestamp: Date.now(), data: gameResult as unknown as Record<string, unknown> });
    setCurrentGameIndex(2);
  }

  function handleSignalSortComplete(gameResult: SignalSortResult) {
    const updated = { ...result, signalSort: gameResult };
    setResult(updated);
    saveProgress(updated);
    signals.push({ event: "signal-sort-complete", timestamp: Date.now(), data: gameResult as unknown as Record<string, unknown> });
    setCurrentGameIndex(3);
  }

  function handleResourceComplete(gameResult: ResourceRouletteResult) {
    const updated = { ...result, resourceRoulette: gameResult, signals };
    setResult(updated);
    saveProgress(updated);
    signals.push({ event: "resource-roulette-complete", timestamp: Date.now(), data: gameResult as unknown as Record<string, unknown> });
    setShowTransition(true);
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="text-center space-y-4 animate-pulse">
          <div
            className="w-12 h-12 mx-auto flex items-center justify-center"
            style={{
              background: "var(--accent-surface)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Sparkles size={24} style={{ color: "var(--accent)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Loading Stage 1...</p>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="glass-card max-w-md w-full mx-4 text-center p-8">
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{
              background: "var(--error-surface)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <AlertCircle size={28} style={{ color: "var(--error)" }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Something went wrong
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Transition ---------- */
  if (showTransition) {
    return (
      <StageTransition
        message="Nice work!"
        subMessage="Now let's build."
        onComplete={() => router.push(`/assess/${token}/stage2`)}
      />
    );
  }

  /* ---------- No scenarios ---------- */
  const currentScenario = scenarios[currentGameIndex];
  if (!currentScenario) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>No scenarios available.</p>
      </div>
    );
  }

  const gameType = currentScenario.tree.type;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Sticky top bar */}
      <div
        className="glass-card sticky top-0 z-20 px-4 py-3"
        style={{
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {/* Stage badge */}
            <span
              className="badge gap-1.5 px-3 py-1"
              style={{
                background: "var(--accent-surface)",
                color: "var(--accent)",
              }}
            >
              <Sparkles size={14} />
              Stage 1 &mdash; Learn
            </span>
            <div className="flex-shrink-0">
              <Timer durationMs={180000} onExpire={handleTimerExpire} />
            </div>
          </div>
          <ProgressBar
            current={currentGameIndex}
            total={4}
            label="Stage 1 — Quick-Fire Games"
          />
        </div>
      </div>

      {/* Game content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-card p-6">
          {gameType === "triage-tower" && currentScenario.tree.items && (
            <TriageTower
              items={currentScenario.tree.items}
              onComplete={handleTriageTowerComplete}
            />
          )}

          {gameType === "trade-off-tiles" && currentScenario.tree.pairs && (
            <TradeOffTiles
              pairs={currentScenario.tree.pairs}
              onComplete={handleTradeOffComplete}
            />
          )}

          {gameType === "signal-sort" && currentScenario.tree.messages && (
            <SignalSort
              messages={currentScenario.tree.messages}
              onComplete={handleSignalSortComplete}
            />
          )}

          {gameType === "resource-roulette" &&
            currentScenario.tree.cards &&
            currentScenario.tree.curveball && (
              <ResourceRoulette
                cards={currentScenario.tree.cards}
                totalTokens={currentScenario.tree.totalTokens ?? 10}
                curveball={currentScenario.tree.curveball}
                onComplete={handleResourceComplete}
              />
            )}
        </div>
      </div>
    </div>
  );
}
