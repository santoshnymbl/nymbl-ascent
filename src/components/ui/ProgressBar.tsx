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
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            Stage {current} of {total}
          </span>
          <span className="font-semibold" style={{ color: "var(--nymbl-primary)" }}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border-light)" }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${pct}%`}
      >
        <div
          className="h-3 rounded-full relative overflow-hidden"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--nymbl-primary), var(--nymbl-primary-light))",
            transition: "width 500ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Animated shimmer overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
