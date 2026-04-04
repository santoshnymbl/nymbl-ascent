"use client";
import { useState, useRef } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import type { ScenarioTree, ScenarioOption } from "@/types";

interface BranchingScenarioProps {
  tree: ScenarioTree;
  onComplete: (path: { nodeId: string; choiceId: string; timeMs: number }[]) => void;
}

type Phase = "question" | "consequence";

export function BranchingScenario({ tree, onComplete }: BranchingScenarioProps) {
  const [currentNodeId, setCurrentNodeId] = useState(tree.rootNodeId);
  const [phase, setPhase] = useState<Phase>("question");
  const [selectedOption, setSelectedOption] = useState<ScenarioOption | null>(null);
  const [path, setPath] = useState<{ nodeId: string; choiceId: string; timeMs: number }[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const nodeStartTime = useRef(Date.now());

  const currentNode = tree.nodes[currentNodeId];

  const optionLetters = ["A", "B", "C", "D", "E", "F"];

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
        setPhase("question");
        setSelectedOption(null);
        nodeStartTime.current = Date.now();
        setTransitioning(false);
      }, 200);
    } else {
      onComplete(path);
    }
  }

  if (!currentNode) { onComplete(path); return null; }

  return (
    <div className="max-w-2xl mx-auto">
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
      </div>
    </div>
  );
}
