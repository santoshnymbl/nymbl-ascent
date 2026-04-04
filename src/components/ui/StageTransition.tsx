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
    // Trigger entrance animation on next frame
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 60%, black) 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9)",
        transition: `opacity 700ms var(--ease-spring), transform 700ms var(--ease-spring)`,
      }}
      role="status"
      aria-live="assertive"
    >
      {/* Animated expanding ring accent */}
      <div
        className="absolute"
        style={{
          width: 120,
          height: 120,
          borderRadius: "var(--radius-full)",
          border: "2px solid var(--accent-light)",
          opacity: 0.3,
          animation: "expandRing 2s ease-out infinite",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute"
        style={{
          width: 120,
          height: 120,
          borderRadius: "var(--radius-full)",
          border: "2px solid var(--accent-light)",
          opacity: 0.2,
          animation: "expandRing 2s ease-out infinite 0.6s",
        }}
        aria-hidden="true"
      />

      <h1
        className="text-4xl md:text-5xl font-bold mb-4 text-center px-6 relative z-10"
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          color: "var(--text-inverse)",
        }}
      >
        {message}
      </h1>
      {subMessage && (
        <p
          className="text-lg md:text-xl text-center px-6 relative z-10"
          style={{ color: "var(--text-inverse)", opacity: 0.7 }}
        >
          {subMessage}
        </p>
      )}

      <style>{`
        @keyframes expandRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
