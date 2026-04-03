"use client";
import { useEffect, useState } from "react";

interface StageTransitionProps {
  message: string;
  subMessage?: string;
  onComplete: () => void;
  durationMs?: number;
}

export function StageTransition({
  message,
  subMessage,
  onComplete,
  durationMs = 3000,
}: StageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div
      className={`fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <h1 className="text-4xl font-bold text-white mb-4">{message}</h1>
      {subMessage && <p className="text-xl text-indigo-200">{subMessage}</p>}
    </div>
  );
}
