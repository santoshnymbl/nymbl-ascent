"use client";
import { useState, useRef } from "react";
import { Check, Tag, FileText } from "lucide-react";

interface Value {
  id: string;
  label: string;
}

interface Situation {
  id: string;
  text: string;
}

interface ValueMatchProps {
  values: Value[];
  situations: Situation[];
  correctMatches: Record<string, string>;
  onComplete: (result: {
    matches: { valueId: string; situationId: string; correct: boolean }[];
    timeMs: number;
  }) => void;
}

export function ValueMatch({
  values,
  situations,
  correctMatches,
  onComplete,
}: ValueMatchProps) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [matchedSituations, setMatchedSituations] = useState<Set<string>>(
    new Set(),
  );
  const startTime = useRef(Date.now());

  function handleValueClick(valueId: string) {
    if (matches[valueId]) return;
    setSelectedValue(valueId);
  }

  function handleSituationClick(situationId: string) {
    if (!selectedValue || matchedSituations.has(situationId)) return;
    setMatches((prev) => ({ ...prev, [selectedValue]: situationId }));
    setMatchedSituations((prev) => new Set(prev).add(situationId));
    setSelectedValue(null);

    const newMatches = { ...matches, [selectedValue]: situationId };
    if (Object.keys(newMatches).length === values.length) {
      setTimeout(() => {
        onComplete({
          matches: Object.entries(newMatches).map(
            ([valueId, situationId]) => ({
              valueId,
              situationId,
              correct: correctMatches[valueId] === situationId,
            }),
          ),
          timeMs: Date.now() - startTime.current,
        });
      }, 300);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Value Match
      </h2>
      <p className="mb-6 text-base" style={{ color: "var(--text-secondary)" }}>
        Match each Nymbl value to the workplace situation that best represents
        it.
      </p>
      <div className="grid grid-cols-2 gap-8">
        {/* Values column */}
        <div className="space-y-3">
          <h3
            className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wider mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <Tag size={14} aria-hidden="true" />
            Values
          </h3>
          {values.map((v) => {
            const isMatched = !!matches[v.id];
            const isSelected = selectedValue === v.id;

            return (
              <button
                key={v.id}
                onClick={() => handleValueClick(v.id)}
                disabled={isMatched}
                className="w-full px-4 py-3 text-left font-medium text-sm"
                style={{
                  borderRadius: "var(--radius-full)",
                  backgroundColor: isMatched
                    ? "transparent"
                    : isSelected
                      ? "var(--accent)"
                      : "var(--bg-surface)",
                  backdropFilter: !isSelected && !isMatched ? "blur(var(--glass-blur))" : undefined,
                  WebkitBackdropFilter: !isSelected && !isMatched ? "blur(var(--glass-blur))" : undefined,
                  color: isMatched
                    ? "var(--success)"
                    : isSelected
                      ? "var(--text-inverse)"
                      : "var(--accent)",
                  border: isMatched
                    ? "2px solid var(--success)"
                    : isSelected
                      ? "2px solid var(--accent)"
                      : "2px solid var(--accent)",
                  opacity: isMatched ? 0.8 : 1,
                  transition: `background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)`,
                  cursor: isMatched ? "default" : "pointer",
                  boxShadow: isSelected ? "var(--shadow-glow)" : "none",
                }}
              >
                <span className="flex items-center gap-2">
                  {isMatched && (
                    <Check size={16} aria-hidden="true" style={{ color: "var(--success)" }} />
                  )}
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Situations column */}
        <div className="space-y-3">
          <h3
            className="flex items-center gap-2 font-semibold text-sm uppercase tracking-wider mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            <FileText size={14} aria-hidden="true" />
            Situations
          </h3>
          {situations.map((s) => {
            const isMatched = matchedSituations.has(s.id);
            const isClickable = !!selectedValue && !isMatched;

            return (
              <button
                key={s.id}
                onClick={() => handleSituationClick(s.id)}
                disabled={isMatched || !selectedValue}
                className="glass-card w-full px-4 py-3 text-left text-sm"
                style={{
                  borderLeft: isMatched
                    ? "4px solid var(--success)"
                    : "4px solid var(--border-subtle)",
                  backgroundColor: isMatched ? "var(--success-surface)" : undefined,
                  color: isMatched
                    ? "var(--success)"
                    : "var(--text-primary)",
                  opacity: !selectedValue && !isMatched ? 0.5 : 1,
                  cursor: isClickable ? "pointer" : "default",
                  transition: `border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast)`,
                }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.borderLeftColor = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.borderLeftColor = "var(--border-subtle)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  {isMatched && (
                    <Check size={16} aria-hidden="true" style={{ color: "var(--success)" }} />
                  )}
                  {s.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
