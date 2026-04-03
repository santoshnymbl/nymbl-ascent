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
        background: "linear-gradient(135deg, var(--nymbl-primary) 0%, var(--nymbl-primary-dark) 100%)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
        transition: "opacity 700ms ease, transform 700ms cubic-bezier(0.4, 0, 0.2, 1)",
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
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.2)",
          animation: "expandRing 2s ease-out infinite",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute"
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,0.15)",
          animation: "expandRing 2s ease-out infinite 0.6s",
        }}
        aria-hidden="true"
      />

      <h1
        className="text-4xl md:text-5xl font-bold text-white mb-4 text-center px-6 relative z-10"
        style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {message}
      </h1>
      {subMessage && (
        <p
          className="text-lg md:text-xl text-center px-6 relative z-10"
          style={{ color: "rgba(255,255,255,0.7)" }}
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
