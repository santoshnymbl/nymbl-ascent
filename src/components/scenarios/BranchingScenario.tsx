"use client";
import { useState, useRef } from "react";
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
  const nodeStartTime = useRef(Date.now());

  const currentNode = tree.nodes[currentNodeId];

  function handleChoice(option: ScenarioOption) {
    const elapsed = Date.now() - nodeStartTime.current;
    const newPath = [...path, { nodeId: currentNodeId, choiceId: option.id, timeMs: elapsed }];
    setPath(newPath);
    setSelectedOption(option);
    setPhase("consequence");
  }

  function handleContinue() {
    if (!selectedOption) return;
    if (selectedOption.nextNodeId && tree.nodes[selectedOption.nextNodeId]) {
      setCurrentNodeId(selectedOption.nextNodeId);
      setPhase("question");
      setSelectedOption(null);
      nodeStartTime.current = Date.now();
    } else {
      onComplete(path);
    }
  }

  if (!currentNode) { onComplete(path); return null; }

  return (
    <div className="max-w-2xl mx-auto">
      {phase === "question" && (
        <>
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
            <p className="text-lg leading-relaxed">{currentNode.text}</p>
          </div>
          <div className="space-y-3">
            {currentNode.options?.map((option) => (
              <button key={option.id} onClick={() => handleChoice(option)}
                className="w-full p-4 bg-white rounded-lg border-2 border-gray-200 text-left hover:border-indigo-400 hover:bg-indigo-50 transition">
                <span className="inline-block w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-center leading-8 font-bold mr-3">{option.label}</span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "consequence" && selectedOption && (
        <>
          <div className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200 mb-6">
            <p className="text-sm font-semibold text-amber-700 mb-2">What happened:</p>
            <p className="text-lg leading-relaxed">{selectedOption.consequence}</p>
          </div>
          <button onClick={handleContinue}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {selectedOption.nextNodeId ? "Continue" : "Finish Scenario"}
          </button>
        </>
      )}
    </div>
  );
}
