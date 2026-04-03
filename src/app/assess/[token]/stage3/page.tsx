"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import type { ScenarioTree, BehavioralSignal } from "@/types";

interface DebugOption {
  id: string;
  text: string;
  correct: boolean;
}

interface FollowUp {
  prompt: string;
  options: { id: string; text: string }[];
}

interface DebugTree {
  type: "debug-challenge";
  problem: string;
  code: string;
  options: DebugOption[];
  followUp: FollowUp;
}

interface BranchingTree extends ScenarioTree {
  rootNodeId: string;
}

interface ScenarioData {
  id: string;
  title: string;
  tree: DebugTree | BranchingTree;
}

type Phase = "challenge" | "followup" | "branching" | "done";

export default function Stage3Page() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("challenge");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signals] = useState<BehavioralSignal[]>([]);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const res = await fetch("/api/admin/scenarios?stage=3&type=role-specific");
        if (!res.ok) throw new Error("Failed to load scenarios");
        const data: ScenarioData[] = await res.json();
        if (data.length > 0) {
          // Pick first available role-specific scenario
          setScenario(data[0]);
          // Determine initial phase based on tree type
          if ("rootNodeId" in data[0].tree) {
            setPhase("branching");
          } else {
            setPhase("challenge");
          }
        }
      } catch {
        setError("Failed to load assessment. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, []);

  const submitAssessment = useCallback(
    async (responses: Record<string, unknown>) => {
      setSubmitting(true);
      try {
        // Save stage 3 progress
        await fetch("/api/assess/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            stage: 3,
            data: {
              challengeType: scenario
                ? "type" in scenario.tree
                  ? (scenario.tree as DebugTree).type
                  : "branching"
                : "unknown",
              responses,
              timeMs: Date.now() - startTime,
              signals,
            },
          }),
        });

        // Submit assessment
        await fetch("/api/assess/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        router.push(`/assess/${token}/complete`);
      } catch (err) {
        console.error("Failed to submit:", err);
        setError("Failed to submit assessment. Please try again.");
        setSubmitting(false);
      }
    },
    [token, scenario, startTime, signals, router],
  );

  const handleTimerExpire = useCallback(() => {
    const responses: Record<string, unknown> = {};
    if (selectedAnswer) responses.answer = selectedAnswer;
    if (selectedFollowUp) responses.followUp = selectedFollowUp;
    submitAssessment(responses);
  }, [selectedAnswer, selectedFollowUp, submitAssessment]);

  function handleAnswerSelect(answerId: string) {
    setSelectedAnswer(answerId);
    signals.push({
      event: "debug-answer-selected",
      timestamp: Date.now(),
      data: { answerId },
    });
  }

  function handleAnswerSubmit() {
    if (!selectedAnswer) return;
    setPhase("followup");
  }

  function handleFollowUpSelect(optionId: string) {
    setSelectedFollowUp(optionId);
    signals.push({
      event: "followup-selected",
      timestamp: Date.now(),
      data: { optionId },
    });
  }

  function handleFollowUpSubmit() {
    if (!selectedFollowUp) return;
    submitAssessment({
      answer: selectedAnswer,
      followUp: selectedFollowUp,
    });
  }

  function handleBranchingComplete(
    path: { nodeId: string; choiceId: string; timeMs: number }[],
  ) {
    signals.push({
      event: "branching-complete",
      timestamp: Date.now(),
      data: { pathLength: path.length },
    });
    submitAssessment({ path });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 text-lg">Loading Stage 3...</div>
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

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No challenge available.</p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 text-lg">Submitting your assessment...</div>
      </div>
    );
  }

  const isDebug = "type" in scenario.tree && scenario.tree.type === "debug-challenge";
  const debugTree = isDebug ? (scenario.tree as DebugTree) : null;
  const branchingTree = !isDebug ? (scenario.tree as BranchingTree) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <ProgressBar
            current={phase === "followup" ? 1 : 0}
            total={isDebug ? 2 : 1}
            label="Stage 3 — Role Challenge"
          />
          <div className="ml-4 flex-shrink-0">
            <Timer durationMs={300000} onExpire={handleTimerExpire} />
          </div>
        </div>

        {/* Debug Challenge */}
        {phase === "challenge" && debugTree && (
          <div>
            <h2 className="text-2xl font-bold mb-4">{scenario.title}</h2>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                {debugTree.problem}
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {debugTree.code}
              </pre>
            </div>
            <div className="space-y-3 mb-6">
              {debugTree.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswerSelect(opt.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    selectedAnswer === opt.id
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* Follow-up Question */}
        {phase === "followup" && debugTree && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Follow-Up</h2>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
              <p className="text-lg leading-relaxed">
                {debugTree.followUp.prompt}
              </p>
            </div>
            <div className="space-y-3 mb-6">
              {debugTree.followUp.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFollowUpSelect(opt.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    selectedFollowUp === opt.id
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <button
              onClick={handleFollowUpSubmit}
              disabled={!selectedFollowUp}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finish Assessment
            </button>
          </div>
        )}

        {/* Branching Scenario */}
        {phase === "branching" && branchingTree && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {scenario.title}
            </h2>
            <BranchingScenario
              tree={branchingTree}
              onComplete={handleBranchingComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
