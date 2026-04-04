"use client";
import { useState, useRef } from "react";
import {
  Users,
  Target,
  TrendingUp,
  Briefcase,
  BookOpen,
  Heart,
  AlertCircle,
  Minus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { ResourceRouletteCard, ResourceRouletteResult } from "@/types";

interface ResourceRouletteProps {
  cards: ResourceRouletteCard[];
  totalTokens: number;
  curveball: { text: string; affectedCardId: string };
  onComplete: (result: ResourceRouletteResult) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Target,
  TrendingUp,
  Briefcase,
  BookOpen,
  Heart,
};

type Phase = "allocate" | "curveball" | "reallocate";

export function ResourceRoulette({
  cards,
  totalTokens,
  curveball,
  onComplete,
}: ResourceRouletteProps) {
  const [phase, setPhase] = useState<Phase>("allocate");
  const [allocations, setAllocations] = useState<Record<string, number>>(() =>
    Object.fromEntries(cards.map((c) => [c.id, 0])),
  );
  const [initialSnapshot, setInitialSnapshot] = useState<
    { cardId: string; tokens: number }[]
  >([]);

  const startTime = useRef(Date.now());
  const reallocStartTime = useRef(0);

  const tokensUsed = Object.values(allocations).reduce((a, b) => a + b, 0);
  const remaining = totalTokens - tokensUsed;

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function adjust(cardId: string, delta: number) {
    setAllocations((prev) => {
      const current = prev[cardId] ?? 0;
      const next = current + delta;
      if (next < 0) return prev;
      const newUsed = tokensUsed + delta;
      if (newUsed > totalTokens) return prev;
      return { ...prev, [cardId]: next };
    });
  }

  function lockIn() {
    const snap = cards.map((c) => ({
      cardId: c.id,
      tokens: allocations[c.id] ?? 0,
    }));
    setInitialSnapshot(snap);
    setPhase("curveball");
  }

  function acknowledgedCurveball() {
    reallocStartTime.current = Date.now();
    setPhase("reallocate");
  }

  function confirmReallocation() {
    onComplete({
      initialAllocation: initialSnapshot,
      curveball: curveball.text,
      reallocation: cards.map((c) => ({
        cardId: c.id,
        tokens: allocations[c.id] ?? 0,
      })),
      timeMs: Date.now() - startTime.current,
      reallocationTimeMs: Date.now() - reallocStartTime.current,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Remaining-tokens colour                                            */
  /* ------------------------------------------------------------------ */

  function remainingColor() {
    if (remaining === 0) return "var(--success)";
    if (remaining <= 3) return "var(--warning)";
    return "var(--accent)";
  }

  function remainingLabel() {
    if (remaining === 0) return "All allocated!";
    return `${remaining} token${remaining !== 1 ? "s" : ""} remaining`;
  }

  /* ------------------------------------------------------------------ */
  /*  Token dots                                                         */
  /* ------------------------------------------------------------------ */

  function TokenDots({ count, max }: { count: number; max: number }) {
    return (
      <div className="flex flex-wrap gap-1 mt-2 justify-center">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "var(--radius-full)",
              background: i < count ? "var(--accent)" : "var(--border-subtle)",
              transition: "background var(--transition-fast)",
            }}
          />
        ))}
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      <h2
        className="text-2xl font-bold mb-2"
        style={{
          color: "var(--text-primary)",
          fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)",
        }}
      >
        Resource Roulette
      </h2>

      {/* Phase indicator */}
      <p
        className="text-sm font-semibold mb-5"
        style={{
          color:
            phase === "reallocate" ? "var(--error)" : "var(--text-secondary)",
        }}
      >
        {phase === "allocate" && "Phase 1: Initial Allocation"}
        {phase === "curveball" && "Phase 2: Curveball Incoming!"}
        {phase === "reallocate" && "Phase 2: Curveball — Reallocate!"}
      </p>

      {/* Token pool */}
      {phase !== "curveball" && (
        <div
          className="glass-card mb-6"
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <span
            className="text-sm font-bold"
            style={{ color: remainingColor() }}
          >
            {remainingLabel()}
          </span>
          <div className="flex flex-wrap gap-1 justify-center">
            {Array.from({ length: totalTokens }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "var(--radius-full)",
                  background:
                    i < totalTokens - remaining
                      ? "var(--accent)"
                      : "var(--border-default)",
                  transition: "background var(--transition-fast)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Curveball event card */}
      {phase === "curveball" && (
        <div
          style={{
            background: "var(--error-surface)",
            border: "2px solid var(--error)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "24px",
            textAlign: "center",
            animation: "curveballIn 0.5s var(--ease-spring)",
          }}
        >
          <AlertCircle
            size={32}
            style={{ color: "var(--error)", margin: "0 auto 12px" }}
            aria-hidden="true"
          />
          <p
            className="text-base font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {curveball.text}
          </p>
          <button
            onClick={acknowledgedCurveball}
            className="btn-cta py-2 px-6 text-sm font-bold"
            style={{ borderRadius: "var(--radius-full)" }}
          >
            Reallocate Tokens
          </button>
        </div>
      )}

      {/* Cards grid */}
      {phase !== "curveball" && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {cards.map((card) => {
            const Icon = ICON_MAP[card.icon] ?? Target;
            const count = allocations[card.id] ?? 0;
            const isAffected =
              phase === "reallocate" && card.id === curveball.affectedCardId;

            return (
              <div
                key={card.id}
                className="glass-card"
                style={{
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "8px",
                  borderRadius: "var(--radius-lg)",
                  border: isAffected
                    ? "2px solid var(--error)"
                    : "1px solid var(--border-subtle)",
                  boxShadow: isAffected ? "0 0 12px var(--error-surface)" : "none",
                  transition:
                    "border var(--transition-fast), box-shadow var(--transition-fast)",
                }}
              >
                <Icon
                  size={28}
                  style={{ color: "var(--accent)" }}
                  aria-hidden="true"
                />
                <span
                  className="font-bold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {card.title}
                </span>
                <span
                  className="text-xs leading-snug"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.description}
                </span>

                {/* Token counter with +/- */}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => adjust(card.id, -1)}
                    disabled={count <= 0}
                    aria-label={`Remove token from ${card.title}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-default)",
                      background:
                        count > 0 ? "var(--accent-surface)" : "var(--bg-input)",
                      color:
                        count > 0 ? "var(--accent)" : "var(--text-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: count > 0 ? "pointer" : "not-allowed",
                      transition: "background var(--transition-fast)",
                    }}
                  >
                    <Minus size={16} />
                  </button>

                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{
                      color: "var(--text-primary)",
                      minWidth: "1.5ch",
                      textAlign: "center",
                    }}
                  >
                    {count}
                  </span>

                  <button
                    type="button"
                    onClick={() => adjust(card.id, 1)}
                    disabled={remaining <= 0}
                    aria-label={`Add token to ${card.title}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-full)",
                      border: "1px solid var(--border-default)",
                      background:
                        remaining > 0
                          ? "var(--accent-surface)"
                          : "var(--bg-input)",
                      color:
                        remaining > 0 ? "var(--accent)" : "var(--text-muted)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: remaining > 0 ? "pointer" : "not-allowed",
                      transition: "background var(--transition-fast)",
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Token dots */}
                <TokenDots count={count} max={totalTokens} />
              </div>
            );
          })}
        </div>
      )}

      {/* Action buttons */}
      {phase === "allocate" && (
        <button
          onClick={lockIn}
          disabled={remaining !== 0}
          className="btn-cta w-full py-3 text-base font-bold"
          style={{
            borderRadius: "var(--radius-full)",
            opacity: remaining === 0 ? 1 : 0.4,
            cursor: remaining === 0 ? "pointer" : "not-allowed",
          }}
        >
          Lock In
        </button>
      )}

      {phase === "reallocate" && (
        <button
          onClick={confirmReallocation}
          disabled={remaining !== 0}
          className="btn-cta w-full py-3 text-base font-bold"
          style={{
            borderRadius: "var(--radius-full)",
            opacity: remaining === 0 ? 1 : 0.4,
            cursor: remaining === 0 ? "pointer" : "not-allowed",
          }}
        >
          Confirm Reallocation
        </button>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes curveballIn {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
