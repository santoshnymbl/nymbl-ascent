"use client";
import { useState, useRef, useCallback } from "react";
import { ThumbsUp, AlertTriangle, MessageSquare } from "lucide-react";
import type { SignalSortMessage, SignalSortResult } from "@/types";

interface SignalSortProps {
  messages: SignalSortMessage[];
  onComplete: (result: SignalSortResult) => void;
}

type Category = "ideal" | "improve";

const AVATAR_COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--cta)",
  "var(--error)",
  "var(--accent-light)",
];

export function SignalSort({ messages, onComplete }: SignalSortProps) {
  const [unsorted, setUnsorted] = useState<SignalSortMessage[]>(() => [...messages]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ideal, setIdeal] = useState<SignalSortMessage[]>([]);
  const [improve, setImprove] = useState<SignalSortMessage[]>([]);
  const [dragSequence, setDragSequence] = useState<string[]>([]);
  const startTime = useRef(Date.now());

  const totalSorted = ideal.length + improve.length;
  const allSorted = totalSorted === messages.length;

  const placeMessage = useCallback(
    (category: Category) => {
      if (!selected) return;
      const msg = unsorted.find((m) => m.id === selected);
      if (!msg) return;

      setUnsorted((prev) => prev.filter((m) => m.id !== selected));
      setDragSequence((prev) => [...prev, selected]);

      if (category === "ideal") {
        setIdeal((prev) => [...prev, msg]);
      } else {
        setImprove((prev) => [...prev, msg]);
      }

      setSelected(null);
    },
    [selected, unsorted],
  );

  function handleConfirm() {
    const categorizations = [
      ...ideal.map((m) => ({ messageId: m.id, category: "ideal" as const })),
      ...improve.map((m) => ({ messageId: m.id, category: "improve" as const })),
    ];
    onComplete({
      categorizations,
      timeMs: Date.now() - startTime.current,
      dragSequence,
    });
  }

  function getAvatarColor(index: number) {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  /** Find the original index of a message for consistent avatar coloring. */
  function originalIndex(id: string) {
    return messages.findIndex((m) => m.id === id);
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading, 'Space Grotesk', sans-serif)" }}
      >
        Signal Sort
      </h2>
      <p
        className="flex items-center gap-2 mb-6 text-base"
        style={{ color: "var(--text-secondary)" }}
      >
        <MessageSquare size={16} aria-hidden="true" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        Read each message, then sort it into the category you think fits best.
      </p>

      {/* Progress */}
      <div
        className="mb-5 text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {totalSorted} of {messages.length} sorted
      </div>

      {/* Category drop zones */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* "How we should work" zone */}
        <button
          type="button"
          onClick={() => placeMessage("ideal")}
          disabled={!selected}
          className="text-left"
          style={{
            background: "var(--success-surface)",
            borderTop: "3px solid var(--success)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            opacity: selected ? 1 : 0.6,
            cursor: selected ? "pointer" : "default",
            transition: "opacity var(--transition-fast), box-shadow var(--transition-fast)",
            boxShadow: selected ? "0 0 0 1px var(--success)" : "none",
            border: "1px solid var(--border-subtle)",
            borderTopWidth: "3px",
            borderTopColor: "var(--success)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp size={18} style={{ color: "var(--success)" }} aria-hidden="true" />
            <span className="font-bold text-sm" style={{ color: "var(--success)" }}>
              How we should work
            </span>
          </div>
          {/* Placed messages */}
          <div className="space-y-2 min-h-[32px]">
            {ideal.map((msg) => (
              <div
                key={msg.id}
                className="badge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  background: "var(--bg-surface-solid)",
                  borderRadius: "var(--radius-full)",
                  color: "var(--text-primary)",
                  animation: "fadeSlideIn 0.3s var(--ease-spring)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "var(--radius-full)",
                    background: getAvatarColor(originalIndex(msg.id)),
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {msg.author.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{msg.author}</span>
              </div>
            ))}
          </div>
        </button>

        {/* "Could be improved" zone */}
        <button
          type="button"
          onClick={() => placeMessage("improve")}
          disabled={!selected}
          className="text-left"
          style={{
            background: "var(--warning-surface)",
            borderTop: "3px solid var(--warning)",
            borderRadius: "var(--radius-lg)",
            padding: "16px",
            opacity: selected ? 1 : 0.6,
            cursor: selected ? "pointer" : "default",
            transition: "opacity var(--transition-fast), box-shadow var(--transition-fast)",
            boxShadow: selected ? "0 0 0 1px var(--warning)" : "none",
            border: "1px solid var(--border-subtle)",
            borderTopWidth: "3px",
            borderTopColor: "var(--warning)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: "var(--warning)" }} aria-hidden="true" />
            <span className="font-bold text-sm" style={{ color: "var(--warning)" }}>
              Could be improved
            </span>
          </div>
          {/* Placed messages */}
          <div className="space-y-2 min-h-[32px]">
            {improve.map((msg) => (
              <div
                key={msg.id}
                className="badge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  background: "var(--bg-surface-solid)",
                  borderRadius: "var(--radius-full)",
                  color: "var(--text-primary)",
                  animation: "fadeSlideIn 0.3s var(--ease-spring)",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "var(--radius-full)",
                    background: getAvatarColor(originalIndex(msg.id)),
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {msg.author.charAt(0).toUpperCase()}
                </span>
                <span className="truncate">{msg.author}</span>
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Unsorted messages list */}
      <div className="space-y-3 mb-8">
        {unsorted.map((msg) => {
          const idx = originalIndex(msg.id);
          const isSelected = selected === msg.id;
          return (
            <button
              key={msg.id}
              type="button"
              onClick={() => setSelected(isSelected ? null : msg.id)}
              className="glass-card w-full text-left"
              style={{
                padding: "14px 16px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                cursor: "pointer",
                border: isSelected
                  ? "2px solid var(--accent)"
                  : "1px solid var(--border-subtle)",
                boxShadow: isSelected ? "0 0 12px var(--accent-glow)" : "none",
                transition:
                  "border var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast)",
                transform: isSelected ? "scale(1.01)" : "scale(1)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              {/* Avatar */}
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-full)",
                  background: getAvatarColor(idx),
                  color: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {msg.author.charAt(0).toUpperCase()}
              </span>

              {/* Message body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {msg.author}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {msg.avatar}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {msg.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      {allSorted && (
        <button
          onClick={handleConfirm}
          className="btn-cta w-full py-3 text-base font-bold"
          style={{
            borderRadius: "var(--radius-full)",
            animation: "fadeSlideIn 0.3s var(--ease-spring)",
          }}
        >
          Confirm Sorting
        </button>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
