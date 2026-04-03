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
                className="w-full px-4 py-3 rounded-full text-left font-medium text-sm cursor-pointer"
                style={{
                  backgroundColor: isMatched
                    ? "transparent"
                    : isSelected
                      ? "var(--nymbl-primary)"
                      : "transparent",
                  color: isMatched
                    ? "var(--nymbl-success)"
                    : isSelected
                      ? "#FFFFFF"
                      : "var(--nymbl-primary)",
                  border: isMatched
                    ? "2px solid var(--nymbl-success)"
                    : isSelected
                      ? "2px solid var(--nymbl-primary)"
                      : "2px solid var(--nymbl-primary)",
                  opacity: isMatched ? 0.8 : 1,
                  transition:
                    "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
                  cursor: isMatched ? "default" : "pointer",
                }}
              >
                <span className="flex items-center gap-2">
                  {isMatched && (
                    <Check size={16} aria-hidden="true" style={{ color: "var(--nymbl-success)" }} />
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
                className="w-full px-4 py-3 rounded-[10px] text-left text-sm"
                style={{
                  backgroundColor: isMatched ? "#F0FDF4" : "var(--bg-card)",
                  borderLeft: isMatched
                    ? "4px solid var(--nymbl-success)"
                    : "4px solid var(--border-light)",
                  borderTop: "1px solid var(--border-light)",
                  borderRight: "1px solid var(--border-light)",
                  borderBottom: "1px solid var(--border-light)",
                  color: isMatched
                    ? "var(--nymbl-success)"
                    : "var(--text-primary)",
                  opacity: !selectedValue && !isMatched ? 0.5 : 1,
                  cursor: isClickable ? "pointer" : "default",
                  transition:
                    "border-color 150ms ease, background-color 150ms ease, transform 150ms ease, opacity 150ms ease",
                }}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.borderLeftColor = "var(--nymbl-primary)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.borderLeftColor = "var(--border-light)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  {isMatched && (
                    <Check size={16} aria-hidden="true" style={{ color: "var(--nymbl-success)" }} />
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
