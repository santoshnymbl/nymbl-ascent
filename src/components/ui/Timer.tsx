"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  durationMs: number;
  onExpire?: () => void;
  className?: string;
}

export function Timer({ durationMs, onExpire, className }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [durationMs, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const remainingSec = remaining / 1000;

  const isCritical = remainingSec < 30;
  const isWarning = remainingSec < 60 && !isCritical;

  let bgColor = "var(--bg-elevated)";
  let textColor = "var(--text-primary)";
  let iconColor = "var(--text-secondary)";

  if (isCritical) {
    bgColor = "#FEF2F2"; // red-50
    textColor = "var(--nymbl-error)";
    iconColor = "var(--nymbl-error)";
  } else if (isWarning) {
    bgColor = "#FFFBEB"; // amber-50
    textColor = "#F59E0B"; // amber-500
    iconColor = "#F59E0B";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-semibold select-none ${className || ""}`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        transition: "background-color 200ms ease, color 200ms ease",
        animation: isCritical ? "timerPulse 1.5s ease-in-out infinite" : "none",
      }}
      role="timer"
      aria-live="polite"
      aria-label={`${minutes} minutes ${seconds} seconds remaining`}
    >
      <Clock size={18} style={{ color: iconColor, transition: "color 200ms ease" }} aria-hidden="true" />
      {minutes}:{seconds.toString().padStart(2, "0")}

      <style>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </span>
  );
}
