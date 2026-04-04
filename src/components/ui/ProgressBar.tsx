"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
            Stage {current} of {total}
          </span>
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className="w-full overflow-hidden"
        style={{
          height: 8,
          borderRadius: "var(--radius-full)",
          background: "var(--bg-surface)",
          backdropFilter: "blur(var(--glass-blur))",
          WebkitBackdropFilter: "blur(var(--glass-blur))",
          border: "var(--glass-border)",
        }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${pct}%`}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "var(--radius-full)",
            background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
            boxShadow: "0 0 12px var(--accent-glow)",
            transition: "width 500ms var(--ease-spring)",
          }}
        >
          {/* Animated shimmer overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              animation: "progressShimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes progressShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
