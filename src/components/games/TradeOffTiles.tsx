"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Scale } from "lucide-react";
import type { TradeOffPair, TradeOffTilesResult } from "@/types";

interface TradeOffTilesProps {
  pairs: TradeOffPair[];
  onComplete: (result: TradeOffTilesResult) => void;
}

type SliderPosition = -2 | -1 | 0 | 1 | 2;

const SLIDER_POSITIONS: SliderPosition[] = [-2, -1, 0, 1, 2];
const ROUND_TIMER_SECONDS = 8;

export function TradeOffTiles({ pairs, onComplete }: TradeOffTilesProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [sliderPosition, setSliderPosition] = useState<SliderPosition>(0);
  const [rounds, setRounds] = useState<
    { pairId: string; sliderPosition: SliderPosition; timeMs: number }[]
  >([]);
  const [timerRemaining, setTimerRemaining] = useState(ROUND_TIMER_SECONDS);

  const startTime = useRef(Date.now());
  const roundStartTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalRounds = pairs.length;
  const pair = pairs[currentRound];

  const advanceRound = useCallback(
    (position: SliderPosition) => {
      const roundTime = Date.now() - roundStartTime.current;
      const newRounds = [
        ...rounds,
        { pairId: pair.id, sliderPosition: position, timeMs: roundTime },
      ];
      setRounds(newRounds);

      if (currentRound + 1 < totalRounds) {
        setCurrentRound((r) => r + 1);
        setSliderPosition(0);
        setTimerRemaining(ROUND_TIMER_SECONDS);
        roundStartTime.current = Date.now();
      } else {
        // All rounds done
        onComplete({
          rounds: newRounds,
          timeMs: Date.now() - startTime.current,
        });
      }
    },
    [rounds, pair, currentRound, totalRounds, onComplete],
  );

  // Countdown timer
  useEffect(() => {
    roundStartTime.current = Date.now();
    setTimerRemaining(ROUND_TIMER_SECONDS);

    timerRef.current = setInterval(() => {
      setTimerRemaining((t) => {
        if (t <= 0.1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return Math.max(0, t - 0.05);
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentRound]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timerRemaining <= 0) {
      advanceRound(0);
    }
  }, [timerRemaining, advanceRound]);

  function handleConfirm() {
    if (timerRef.current) clearInterval(timerRef.current);
    advanceRound(sliderPosition);
  }

  // Timer bar color: accent → warning → error
  function getTimerColor(): string {
    const ratio = timerRemaining / ROUND_TIMER_SECONDS;
    if (ratio > 0.5) return "var(--accent)";
    if (ratio > 0.25) return "var(--warning)";
    return "var(--error)";
  }

  // Scale cards based on slider position
  const leftScale = sliderPosition < 0 ? 1.02 : 1;
  const rightScale = sliderPosition > 0 ? 1.02 : 1;
  const leftBorderBright = sliderPosition < 0;
  const rightBorderBright = sliderPosition > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading, inherit)" }}
      >
        Trade-Off Tiles
      </h2>
      <p
        className="flex items-center gap-2 mb-6 text-base"
        style={{ color: "var(--text-secondary)" }}
      >
        <Scale size={16} aria-hidden="true" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        Weigh each trade-off. Slide toward the behavior you lean into more.
      </p>

      {/* Round progress */}
      <div
        className="flex items-center gap-2 mb-4"
        aria-label={`Round ${currentRound + 1} of ${totalRounds}`}
      >
        {pairs.map((_, i) => (
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
                    : "transparent",
              border:
                i < currentRound
                  ? "2px solid var(--accent)"
                  : i === currentRound
                    ? "2px solid var(--accent)"
                    : "2px solid var(--border-default)",
              boxShadow:
                i === currentRound
                  ? "0 0 0 3px var(--accent-glow)"
                  : "none",
              opacity: i > currentRound ? 0.4 : 1,
              transition: "all var(--transition-base)",
            }}
            aria-hidden="true"
          />
        ))}
        <span
          className="ml-2 text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Round {currentRound + 1} of {totalRounds}
        </span>
      </div>

      {/* Timer bar */}
      <div
        className="mb-8"
        style={{
          height: 3,
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(timerRemaining / ROUND_TIMER_SECONDS) * 100}%`,
            backgroundColor: getTimerColor(),
            borderRadius: "var(--radius-full)",
            transition: "width 0.05s linear, background-color 0.3s",
          }}
        />
      </div>

      {/* Two behavior cards + slider */}
      <div
        className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-8"
        style={{ animation: "fadeSlideIn 0.35s var(--ease-spring) both" }}
        key={currentRound} // re-mount for animation on each round
      >
        {/* Left card */}
        <div
          className="glass-card px-4 py-5 flex flex-col"
          style={{
            borderLeft: `4px solid ${leftBorderBright ? "var(--accent)" : "var(--border-subtle)"}`,
            transform: `scale(${leftScale})`,
            boxShadow: leftBorderBright ? "0 0 16px var(--accent-glow)" : undefined,
            transition: `transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)`,
          }}
        >
          <p
            className="text-base leading-relaxed flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            {pair.leftText}
          </p>
        </div>

        {/* Center VS divider */}
        <div className="flex items-center justify-center px-2">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)", writingMode: "vertical-lr" }}
          >
            vs
          </span>
        </div>

        {/* Right card */}
        <div
          className="glass-card px-4 py-5 flex flex-col"
          style={{
            borderRight: `4px solid ${rightBorderBright ? "var(--accent)" : "var(--border-subtle)"}`,
            transform: `scale(${rightScale})`,
            boxShadow: rightBorderBright ? "0 0 16px var(--accent-glow)" : undefined,
            transition: `transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast)`,
          }}
        >
          <p
            className="text-base leading-relaxed flex-1"
            style={{ color: "var(--text-primary)" }}
          >
            {pair.rightText}
          </p>
        </div>
      </div>

      {/* Slider */}
      <div className="mb-8">
        {/* Track */}
        <div className="relative flex items-center justify-between px-4" style={{ height: 40 }}>
          {/* Line behind dots */}
          <div
            className="absolute left-4 right-4"
            style={{
              height: 2,
              backgroundColor: "var(--border-subtle)",
              top: "50%",
              transform: "translateY(-50%)",
              borderRadius: "var(--radius-full)",
            }}
          />
          {/* Active range fill */}
          {sliderPosition !== 0 && (
            <div
              className="absolute"
              style={{
                height: 2,
                backgroundColor: "var(--accent)",
                top: "50%",
                transform: "translateY(-50%)",
                left:
                  sliderPosition < 0
                    ? `calc(${((sliderPosition + 2) / 4) * 100}% + 4px)`
                    : "calc(50% + 4px)",
                right:
                  sliderPosition > 0
                    ? `calc(${((2 - sliderPosition) / 4) * 100}% + 4px)`
                    : "calc(50% + 4px)",
                borderRadius: "var(--radius-full)",
                transition: "left var(--transition-fast), right var(--transition-fast)",
              }}
            />
          )}

          {/* Dots */}
          {SLIDER_POSITIONS.map((pos) => {
            const isActive = pos === sliderPosition;
            const size = isActive ? 16 : 10;
            return (
              <button
                key={pos}
                onClick={() => setSliderPosition(pos)}
                className="relative z-10 flex items-center justify-center"
                style={{
                  width: size,
                  height: size,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isActive ? "var(--accent)" : "var(--bg-surface-solid)",
                  border: isActive
                    ? "none"
                    : "2px solid var(--border-default)",
                  boxShadow: isActive ? "0 0 10px var(--accent-glow)" : "none",
                  cursor: "pointer",
                  transition: `all var(--transition-fast)`,
                  padding: 0,
                }}
                aria-label={
                  pos === -2
                    ? "Strongly left"
                    : pos === -1
                      ? "Slightly left"
                      : pos === 0
                        ? "Neutral"
                        : pos === 1
                          ? "Slightly right"
                          : "Strongly right"
                }
              />
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex justify-between px-2 mt-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Strongly
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Neutral
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Strongly
          </span>
        </div>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        className="btn-cta w-full py-3 text-base font-bold"
        style={{ borderRadius: "var(--radius-full)" }}
      >
        <span className="flex items-center justify-center gap-2">
          <Check size={18} aria-hidden="true" />
          Confirm &amp; Next
        </span>
      </button>

      {/* CSS keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
