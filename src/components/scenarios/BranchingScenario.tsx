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
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {phase === "question" && (
          <>
            {/* Scenario text card with top accent border */}
            <div
              className="rounded-[10px] p-6 mb-6"
              style={{
                backgroundColor: "var(--bg-card)",
                borderTop: "4px solid var(--nymbl-primary)",
                border: "1px solid var(--border-light)",
                borderTopWidth: "4px",
                borderTopColor: "var(--nymbl-primary)",
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
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-[10px] text-left cursor-pointer"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-light)",
                    transition:
                      "background-color 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#EFF6FF";
                    e.currentTarget.style.borderColor = "var(--nymbl-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-card)";
                    e.currentTarget.style.borderColor = "var(--border-light)";
                  }}
                >
                  {/* Letter badge */}
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
                    style={{
                      backgroundColor: "#DBEAFE", // primary-100
                      color: "var(--nymbl-primary)",
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
            {/* Consequence card with amber/orange accent */}
            <div
              className="rounded-[10px] p-6 mb-6"
              style={{
                backgroundColor: "#FFFBEB",
                borderTop: "1px solid #FDE68A",
                borderRight: "1px solid #FDE68A",
                borderBottom: "1px solid #FDE68A",
                borderLeft: "4px solid #F59E0B",
              }}
            >
              <p
                className="text-sm font-semibold mb-2"
                style={{ color: "#B45309" }}
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-bold text-base text-white cursor-pointer"
                style={{
                  backgroundColor: "var(--nymbl-primary)",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--nymbl-primary-dark)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--nymbl-primary)")}
              >
                Continue
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] font-bold text-base text-white cursor-pointer"
                style={{
                  backgroundColor: "var(--nymbl-cta)",
                  transition: "background-color 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--nymbl-cta-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--nymbl-cta)")}
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
