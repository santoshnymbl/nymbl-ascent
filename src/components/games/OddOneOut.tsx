"use client";
import { useState, useRef } from "react";
import { HelpCircle } from "lucide-react";

interface OddOption {
  id: string;
  text: string;
}

interface OddRound {
  id: string;
  prompt: string;
  options: OddOption[];
}

interface OddOneOutProps {
  rounds: OddRound[];
  correctAnswers: Record<string, string>;
  onComplete: (result: {
    picks: { roundId: string; chosenId: string; correct: boolean }[];
    timeMs: number;
  }) => void;
}

export function OddOneOut({
  rounds,
  onComplete,
  correctAnswers,
}: OddOneOutProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [picks, setPicks] = useState<
    { roundId: string; chosenId: string; correct: boolean }[]
  >([]);
  const [flashedId, setFlashedId] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  function handlePick(optionId: string) {
    if (flashedId) return; // prevent double clicks during flash

    const round = rounds[currentRound];
    const correct = correctAnswers[round.id] === optionId;
    const newPicks = [
      ...picks,
      { roundId: round.id, chosenId: optionId, correct },
    ];

    // Flash the selected option briefly
    setFlashedId(optionId);
    setTimeout(() => {
      setPicks(newPicks);
      setFlashedId(null);
      if (currentRound + 1 < rounds.length) {
        setCurrentRound(currentRound + 1);
      } else {
        onComplete({ picks: newPicks, timeMs: Date.now() - startTime.current });
      }
    }, 250);
  }

  const round = rounds[currentRound];

  return (
    <div className="max-w-lg mx-auto">
      <h2
        className="text-2xl font-bold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        Odd One Out
      </h2>

      {/* Step dots indicator */}
      <div className="flex items-center gap-2 mb-6" aria-label={`Round ${currentRound + 1} of ${rounds.length}`}>
        {rounds.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "var(--radius-full)",
              backgroundColor:
                i < currentRound
                  ? "var(--accent)"
                  : i === currentRound
                    ? "var(--accent)"
                    : "var(--border-default)",
              border:
                i === currentRound
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              boxShadow:
                i === currentRound
                  ? "0 0 0 3px var(--accent-glow)"
                  : "none",
              opacity: i < currentRound ? 1 : i === currentRound ? 1 : 0.5,
              transition: `all var(--transition-base)`,
            }}
            aria-hidden="true"
          />
        ))}
        <span
          className="ml-2 text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Round {currentRound + 1} of {rounds.length}
        </span>
      </div>

      {/* Question prompt card */}
      <div
        className="glass-card px-5 py-4 mb-6 flex items-start gap-3"
        style={{
          backgroundColor: "var(--accent-surface)",
        }}
      >
        <HelpCircle
          size={20}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--accent)" }}
          aria-hidden="true"
        />
        <p
          className="text-lg font-medium leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {round.prompt}
        </p>
      </div>

      {/* Option buttons */}
      <div className="space-y-3">
        {round.options.map((opt) => {
          const isFlashed = flashedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handlePick(opt.id)}
              disabled={!!flashedId}
              className="glass-card w-full px-5 py-4 text-left text-base font-medium cursor-pointer"
              style={{
                backgroundColor: isFlashed
                  ? "var(--accent)"
                  : undefined,
                color: isFlashed ? "var(--text-inverse)" : "var(--text-primary)",
                borderColor: isFlashed
                  ? "var(--accent)"
                  : undefined,
                boxShadow: isFlashed ? "var(--shadow-glow)" : undefined,
                transition: `background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast)`,
              }}
              onMouseEnter={(e) => {
                if (!flashedId) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }
              }}
              onMouseLeave={(e) => {
                if (!flashedId && !isFlashed) {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
