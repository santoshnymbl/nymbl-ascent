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
        style={{ background: "var(--bg-base)" }}
      >
        <div className="text-center space-y-4 animate-pulse">
          <div
            className="w-12 h-12 mx-auto flex items-center justify-center"
            style={{
              background: "var(--success-surface)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Target size={24} style={{ color: "var(--success)" }} />
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

  /* ---------- No scenario ---------- */
  if (!scenario) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
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
        style={{ background: "var(--bg-base)" }}
      >
        <div className="text-center space-y-4">
          <div
            className="w-10 h-10 mx-auto animate-spin"
            style={{
              borderRadius: "var(--radius-full)",
              border: "3px solid var(--border-default)",
              borderTopColor: "var(--accent)",
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
                background: "var(--success-surface)",
                color: "var(--success)",
              }}
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
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              {scenario.title}
            </h2>

            {/* Problem card */}
            <div className="glass-card p-6 mb-6">
              <p
                className="leading-relaxed mb-5"
                style={{ color: "var(--text-secondary)" }}
              >
                {debugTree.problem}
              </p>

              {/* Code block */}
              <div
                className="overflow-hidden"
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Code header bar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-2"
                  style={{ background: "var(--bg-surface-solid)" }}
                >
                  <div className="w-2.5 h-2.5" style={{ borderRadius: "var(--radius-full)", background: "var(--error)" }} />
                  <div className="w-2.5 h-2.5" style={{ borderRadius: "var(--radius-full)", background: "var(--warning)" }} />
                  <div className="w-2.5 h-2.5" style={{ borderRadius: "var(--radius-full)", background: "var(--success)" }} />
                  <span
                    className="ml-2 text-xs font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    code
                  </span>
                </div>
                {/* Code content */}
                <pre
                  className="p-4 overflow-x-auto text-sm font-mono leading-relaxed"
                  style={{
                    background: "var(--bg-surface-solid)",
                    color: "var(--success)",
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
                  className="glass-card w-full p-4 text-left cursor-pointer"
                  style={{
                    background:
                      selectedAnswer === opt.id ? "var(--accent-surface)" : "var(--bg-surface)",
                    border:
                      selectedAnswer === opt.id
                        ? "2px solid var(--accent)"
                        : "var(--glass-border)",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderRadius: "var(--radius-full)",
                        border:
                          selectedAnswer === opt.id
                            ? "2px solid var(--accent)"
                            : "2px solid var(--border-default)",
                        background:
                          selectedAnswer === opt.id
                            ? "var(--accent)"
                            : "transparent",
                      }}
                    >
                      {selectedAnswer === opt.id && (
                        <CheckCircle2 size={14} style={{ color: "var(--text-inverse)" }} />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{opt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
              className="btn-primary w-full py-3.5"
              style={{
                borderRadius: "var(--radius-lg)",
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
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              Follow-Up
            </h2>

            <div className="glass-card p-6 mb-6">
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
                  className="glass-card w-full p-4 text-left cursor-pointer"
                  style={{
                    background:
                      selectedFollowUp === opt.id ? "var(--accent-surface)" : "var(--bg-surface)",
                    border:
                      selectedFollowUp === opt.id
                        ? "2px solid var(--accent)"
                        : "var(--glass-border)",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 flex-shrink-0 flex items-center justify-center"
                      style={{
                        borderRadius: "var(--radius-full)",
                        border:
                          selectedFollowUp === opt.id
                            ? "2px solid var(--accent)"
                            : "2px solid var(--border-default)",
                        background:
                          selectedFollowUp === opt.id
                            ? "var(--accent)"
                            : "transparent",
                      }}
                    >
                      {selectedFollowUp === opt.id && (
                        <CheckCircle2 size={14} style={{ color: "var(--text-inverse)" }} />
                      )}
                    </div>
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>{opt.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleFollowUpSubmit}
              disabled={!selectedFollowUp}
              className="btn-cta w-full py-3.5"
              style={{
                borderRadius: "var(--radius-lg)",
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
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
            >
              {scenario.title}
            </h2>
            <div className="glass-card p-6">
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
