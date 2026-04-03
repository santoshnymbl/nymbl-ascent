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
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              backgroundColor:
                i < currentRound
                  ? "var(--nymbl-primary)"
                  : i === currentRound
                    ? "var(--nymbl-primary)"
                    : "var(--border-light)",
              border:
                i === currentRound
                  ? "2px solid var(--nymbl-primary)"
                  : "2px solid transparent",
              boxShadow:
                i === currentRound
                  ? "0 0 0 3px rgba(37, 99, 235, 0.2)"
                  : "none",
              opacity: i < currentRound ? 1 : i === currentRound ? 1 : 0.5,
              transition: "all 200ms ease",
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
        className="rounded-[10px] px-5 py-4 mb-6 flex items-start gap-3"
        style={{
          backgroundColor: "#EFF6FF", // primary-50
          border: "1px solid var(--border-light)",
        }}
      >
        <HelpCircle
          size={20}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--nymbl-primary)" }}
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
              className="w-full px-5 py-4 rounded-[10px] text-left text-base font-medium cursor-pointer"
              style={{
                backgroundColor: isFlashed
                  ? "var(--nymbl-primary)"
                  : "var(--bg-card)",
                color: isFlashed ? "#FFFFFF" : "var(--text-primary)",
                border: isFlashed
                  ? "2px solid var(--nymbl-primary)"
                  : "2px solid var(--border-light)",
                transition:
                  "background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (!flashedId) {
                  e.currentTarget.style.borderColor = "var(--nymbl-primary)";
                  e.currentTarget.style.backgroundColor = "#EFF6FF";
                }
              }}
              onMouseLeave={(e) => {
                if (!flashedId && !isFlashed) {
                  e.currentTarget.style.borderColor = "var(--border-light)";
                  e.currentTarget.style.backgroundColor = "var(--bg-card)";
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
