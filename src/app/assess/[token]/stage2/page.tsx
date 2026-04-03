"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import { StageTransition } from "@/components/ui/StageTransition";
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
    async function fetchScenarios() {
      try {
        const res = await fetch("/api/admin/scenarios?stage=2&type=core");
        if (!res.ok) throw new Error("Failed to load scenarios");
        const data: ScenarioData[] = await res.json();
        // Randomly pick 2 scenarios
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setScenarios(shuffled.slice(0, 2));
      } catch {
        setError("Failed to load assessment. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 text-lg">Loading Stage 2...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (showTransition) {
    return (
      <StageTransition
        message="One more stage"
        subMessage="Show us how you grow."
        onComplete={() => router.push(`/assess/${token}/stage3`)}
      />
    );
  }

  const currentScenario = scenarios[currentIndex];
  if (!currentScenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No scenarios available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <ProgressBar
            current={currentIndex}
            total={scenarios.length}
            label="Stage 2 — Workplace Scenarios"
          />
          <div className="ml-4 flex-shrink-0">
            <Timer durationMs={300000} onExpire={handleTimerExpire} />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {currentScenario.title}
        </h2>

        <BranchingScenario
          key={currentScenario.id}
          tree={currentScenario.tree}
          onComplete={handleScenarioComplete}
        />
      </div>
    </div>
  );
}
