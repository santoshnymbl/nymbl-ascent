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

  let bgColor = "var(--bg-surface)";
  let textColor = "var(--text-secondary)";
  let iconColor = "var(--text-secondary)";
  let borderColor = "var(--border-subtle)";

  if (isCritical) {
    bgColor = "var(--error-surface)";
    textColor = "var(--error)";
    iconColor = "var(--error)";
    borderColor = "var(--error)";
  } else if (isWarning) {
    bgColor = "var(--warning-surface)";
    textColor = "var(--warning)";
    iconColor = "var(--warning)";
    borderColor = "var(--warning)";
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 text-lg font-semibold select-none ${className || ""}`}
      style={{
        borderRadius: "var(--radius-full)",
        backgroundColor: bgColor,
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontVariantNumeric: "tabular-nums",
        transition: "background-color var(--transition-base), color var(--transition-base), border-color var(--transition-base)",
        animation: isCritical ? "timerPulse 1.5s ease-in-out infinite" : "none",
      }}
      role="timer"
      aria-live="polite"
      aria-label={`${minutes} minutes ${seconds} seconds remaining`}
    >
      <Clock
        size={18}
        style={{
          color: iconColor,
          transition: "color var(--transition-base)",
        }}
        aria-hidden="true"
      />
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
