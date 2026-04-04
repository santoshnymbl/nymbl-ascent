"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function CompletePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, color-mix(in srgb, var(--success) 5%, transparent) 0%, var(--bg-base) 50%)",
      }}
    >
      {/* Floating sparkle dots */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {[
          { top: "12%", left: "18%", delay: "0s", size: 6 },
          { top: "8%", left: "72%", delay: "0.5s", size: 8 },
          { top: "25%", left: "85%", delay: "1s", size: 5 },
          { top: "20%", left: "10%", delay: "1.5s", size: 7 },
          { top: "35%", left: "90%", delay: "0.8s", size: 4 },
          { top: "15%", left: "45%", delay: "1.2s", size: 6 },
          { top: "30%", left: "30%", delay: "0.3s", size: 5 },
          { top: "5%", left: "60%", delay: "1.8s", size: 7 },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              borderRadius: "var(--radius-full)",
              background: i % 2 === 0 ? "var(--accent)" : "var(--cta)",
              opacity: 0.3,
              animation: `sparkle-float 3s ease-in-out ${dot.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className="max-w-lg w-full text-center px-6 relative z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 600ms ease, transform 600ms ease",
        }}
      >
        {/* Animated checkmark — 80px */}
        <div
          className="w-20 h-20 flex items-center justify-center mx-auto mb-8"
          style={{
            background: "var(--success-surface)",
            border: "3px solid var(--success)",
            borderRadius: "var(--radius-full)",
            animation: mounted ? "check-pop 500ms ease 300ms both" : "none",
          }}
        >
          <CheckCircle2
            size={44}
            strokeWidth={2}
            style={{ color: "var(--success)" }}
          />
        </div>

        {/* Heading */}
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          Assessment Complete!
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Thanks for completing{" "}
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Nymbl Ascent
          </span>
        </p>

        {/* Detail text */}
        <p
          className="text-sm leading-relaxed mb-10"
          style={{ color: "var(--text-muted)" }}
        >
          Our team will review your results and be in touch soon.
        </p>

        {/* Divider */}
        <div
          className="w-12 h-px mx-auto mb-6"
          style={{ background: "var(--border-default)" }}
        />

        {/* Nymbl branding */}
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles size={14} style={{ color: "var(--text-muted)" }} />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}
          >
            nymbl
          </span>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--cta)" }}
          >
            ascent
          </span>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes sparkle-float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-12px) scale(1.3);
            opacity: 0.6;
          }
        }
        @keyframes check-pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
