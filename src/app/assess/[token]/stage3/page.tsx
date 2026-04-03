"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BranchingScenario } from "@/components/scenarios/BranchingScenario";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Timer } from "@/components/ui/Timer";
import { Target, AlertCircle, CheckCircle2 } from "lucide-react";
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

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center space-y-4 animate-pulse">
          <div
            className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center"
            style={{ background: "#F0FDF4" }}
          >
            <Target size={24} style={{ color: "#16A34A" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>Loading Stage 3...</p>
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="max-w-md w-full mx-4 text-center rounded-2xl p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FEF2F2" }}
          >
            <AlertCircle size={28} style={{ color: "var(--nymbl-error)" }} />
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

  /* ---------- No scenario ---------- */
  if (!scenario) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <p style={{ color: "var(--text-secondary)" }}>No challenge available.</p>
      </div>
    );
  }

  /* ---------- Submitting ---------- */
  if (submitting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-full mx-auto animate-spin"
            style={{
              border: "3px solid var(--border-light)",
              borderTopColor: "var(--nymbl-primary)",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }}>
            Submitting your assessment...
          </p>
        </div>
      </div>
    );
  }

  const isDebug = "type" in scenario.tree && scenario.tree.type === "debug-challenge";
  const debugTree = isDebug ? (scenario.tree as DebugTree) : null;
  const branchingTree = !isDebug ? (scenario.tree as BranchingTree) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Fixed top bar */}
      <div
        className="sticky top-0 z-20 px-4 py-3"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {/* Stage pill badge */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: "#DCFCE7", color: "#166534" }}
            >
              <Target size={14} />
              Stage 3 &mdash; Grow
            </span>
            <div className="flex-shrink-0">
              <Timer durationMs={300000} onExpire={handleTimerExpire} />
            </div>
          </div>
          <ProgressBar
            current={phase === "followup" ? 1 : 0}
            total={isDebug ? 2 : 1}
            label="Stage 3 — Role Challenge"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Debug Challenge */}
        {phase === "challenge" && debugTree && (
          <div>
            <h2
              className="text-2xl font-bold mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              {scenario.title}
            </h2>

            {/* Problem card */}
            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p
                className="leading-relaxed mb-5"
                style={{ color: "var(--text-secondary)" }}
              >
                {debugTree.problem}
              </p>

              {/* Code block with syntax-highlight look */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid #1E293B" }}
              >
                {/* Code header bar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-2"
                  style={{ background: "#1E293B" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#EF4444" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#F59E0B" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22C55E" }} />
                  <span
                    className="ml-2 text-xs font-mono"
                    style={{ color: "#94A3B8" }}
                  >
                    code
                  </span>
                </div>
                {/* Code content */}
                <pre
                  className="p-4 overflow-x-auto text-sm font-mono leading-relaxed"
                  style={{
                    background: "#0F172A",
                    color: "#4ADE80",
                    margin: 0,
                  }}
                >
                  {debugTree.code}
                </pre>
              </div>
            </div>

            {/* Answer options */}
            <div className="space-y-3 mb-6">
              {debugTree.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswerSelect(opt.id)}
                  className="w-full p-4 rounded-xl text-left cursor-pointer"
                  style={{
                    background:
                      selectedAnswer === opt.id ? "#EFF6FF" : "var(--bg-card)",
                    border:
                      selectedAnswer === opt.id
                        ? "2px solid var(--nymbl-primary)"
                        : "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border:
                          selectedAnswer === opt.id
                            ? "2px solid var(--nymbl-primary)"
                            : "2px solid var(--border-default)",
                        background:
                          selectedAnswer === opt.id
                            ? "var(--nymbl-primary)"
                            : "transparent",
                      }}
                    >
                      {selectedAnswer === opt.id && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className="w-full py-3.5 rounded-xl font-semibold text-white cursor-pointer"
              style={{
                background: selectedAnswer
                  ? "var(--nymbl-primary)"
                  : "var(--border-default)",
                transition: "var(--transition-fast)",
                opacity: selectedAnswer ? 1 : 0.5,
                cursor: selectedAnswer ? "pointer" : "not-allowed",
              }}
            >
              Submit Answer
            </button>
          </div>
        )}

        {/* Follow-up Question */}
        {phase === "followup" && debugTree && (
          <div>
            <h2
              className="text-2xl font-bold mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              Follow-Up
            </h2>

            <div
              className="rounded-2xl p-6 mb-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--text-primary)" }}
              >
                {debugTree.followUp.prompt}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {debugTree.followUp.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleFollowUpSelect(opt.id)}
                  className="w-full p-4 rounded-xl text-left cursor-pointer"
                  style={{
                    background:
                      selectedFollowUp === opt.id ? "#EFF6FF" : "var(--bg-card)",
                    border:
                      selectedFollowUp === opt.id
                        ? "2px solid var(--nymbl-primary)"
                        : "1px solid var(--border-light)",
                    color: "var(--text-primary)",
                    transition: "var(--transition-fast)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{
                        border:
                          selectedFollowUp === opt.id
                            ? "2px solid var(--nymbl-primary)"
                            : "2px solid var(--border-default)",
                        background:
                          selectedFollowUp === opt.id
                            ? "var(--nymbl-primary)"
                            : "transparent",
                      }}
                    >
                      {selectedFollowUp === opt.id && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm">{opt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleFollowUpSubmit}
              disabled={!selectedFollowUp}
              className="w-full py-3.5 rounded-xl font-semibold text-white cursor-pointer"
              style={{
                background: selectedFollowUp
                  ? "var(--nymbl-cta)"
                  : "var(--border-default)",
                transition: "var(--transition-fast)",
                opacity: selectedFollowUp ? 1 : 0.5,
                cursor: selectedFollowUp ? "pointer" : "not-allowed",
              }}
            >
              Finish Assessment
            </button>
          </div>
        )}

        {/* Branching Scenario */}
        {phase === "branching" && branchingTree && (
          <div>
            <h2
              className="text-xl font-bold mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              {scenario.title}
            </h2>
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
              }}
            >
              <BranchingScenario
                tree={branchingTree}
                onComplete={handleBranchingComplete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
