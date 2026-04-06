"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import { StageTransition } from "@/components/ui/StageTransition";
import { Brain, AlertCircle } from "lucide-react";
import type { ScenarioTree, BehavioralSignal, Stage2Result } from "@/types";

interface ScenarioData {
  id: string;
  title: string;
  tree: ScenarioTree;
}

export default function Stage2Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [completedScenarios, setCompletedScenarios] = useState<
    Stage2Result["scenarios"]
  >([]);

  useEffect(() => {
    if (!token) return;
    async function fetchScenarios() {
      try {
        const res = await fetch(`/api/assess/scenarios?token=${token}&stage=2`);
        if (!res.ok) throw new Error("Failed to load scenarios");
        const data: ScenarioData[] = await res.json();
        setScenarios(data);
      } catch {
        setError("Failed to load assessment. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, [token]);

  const saveProgress = useCallback(
    async (scenarioResults: Stage2Result["scenarios"]) => {
      try {
        await fetch("/api/assess/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            stage: 2,
            data: { scenarios: scenarioResults, signals },
          }),
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [token, signals],
  );

  const handleTimerExpire = useCallback(() => {
    saveProgress(completedScenarios);
    setShowTransition(true);
  }, [completedScenarios, saveProgress]);

  function handleScenarioComplete(
    path: { nodeId: string; choiceId: string; timeMs: number }[],
  ) {
    const scenario = scenarios[currentIndex];
    const updated = [
      ...completedScenarios,
      { scenarioId: scenario.id, path },
    ];
    setCompletedScenarios(updated);
    signals.push({
      event: "scenario-complete",
      timestamp: Date.now(),
      data: { scenarioId: scenario.id, pathLength: path.length },
    });
    saveProgress(updated);

    if (currentIndex + 1 < scenarios.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowTransition(true);
    }
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
              background: "var(--warning-surface)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Brain size={24} style={{ color: "var(--warning)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Loading Stage 2...</p>
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
        message="One more stage"
        subMessage="Show us how you grow."
        onComplete={() => router.push(`/assess/${token}/stage3`)}
      />
    );
  }

  /* ---------- No scenarios attached to this role ---------- */
  if (scenarios.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="glass-card max-w-md w-full mx-4 text-center p-8">
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--warning-surface)", borderRadius: "var(--radius-full)" }}
          >
            <AlertCircle size={28} style={{ color: "var(--warning)" }} />
          </div>
          <p className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Stage 2 isn&apos;t set up for your role yet
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            No Stage 2 scenarios are attached to your role. Please contact your hiring
            coordinator and ask them to attach scenarios in the admin panel.
          </p>
          <button
            onClick={() => router.push(`/assess/${token}/stage3`)}
            className="btn-ghost"
            style={{ fontSize: "0.875rem" }}
          >
            Skip to Stage 3
          </button>
        </div>
      </div>
    );
  }

  const currentScenario = scenarios[currentIndex];
  if (!currentScenario) return null;

  /* ---------- Step dots ---------- */
  const stepDots = Array.from({ length: scenarios.length }, (_, i) => i);

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
                background: "var(--warning-surface)",
                color: "var(--warning)",
              }}
            >
              <Brain size={14} />
              Stage 2 &mdash; Build
            </span>
            <div className="flex-shrink-0">
              <Timer durationMs={360000} onExpire={handleTimerExpire} />
            </div>
          </div>
          <ProgressBar
            current={currentIndex}
            total={scenarios.length}
            label="Stage 2 — Workplace Scenarios"
          />
        </div>
      </div>

      {/* Scenario content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Scenario counter + step dots */}
        <div className="flex items-center justify-between mb-6">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Scenario {currentIndex + 1} of {scenarios.length}
          </p>
          <div className="flex items-center gap-2">
            {stepDots.map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5"
                style={{
                  borderRadius: "var(--radius-full)",
                  background:
                    i <= currentIndex
                      ? "var(--accent)"
                      : "var(--border-default)",
                  transition: "var(--transition-fast)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Scenario title */}
        <h2
          className="text-xl font-bold mb-5"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          {currentScenario.title}
        </h2>

        {/* Scenario card */}
        <div className="glass-card p-6">
          <BranchingScenario
            key={currentScenario.id}
            tree={currentScenario.tree}
            onComplete={handleScenarioComplete}
          />
        </div>
      </div>
    </div>
  );
}
