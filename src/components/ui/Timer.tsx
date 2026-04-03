"use client";
import { useEffect, useState } from "react";

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
  const isLow = remaining < 30000;

  return (
    <span
      className={`font-mono text-lg ${isLow ? "text-red-500 animate-pulse" : "text-gray-700"} ${className || ""}`}
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
  );
}
