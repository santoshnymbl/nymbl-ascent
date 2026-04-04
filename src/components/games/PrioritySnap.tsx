"use client";
import { useState, useRef } from "react";
import { GripVertical, ArrowUpDown } from "lucide-react";

interface Item {
  id: string;
  label: string;
  weight: number;
}

interface PrioritySnapProps {
  items: Item[];
  onComplete: (result: {
    order: string[];
    timeMs: number;
    revisions: number;
  }) => void;
}

export function PrioritySnap({ items, onComplete }: PrioritySnapProps) {
  const [orderedItems, setOrderedItems] = useState(() =>
    [...items].sort(() => Math.random() - 0.5),
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [revisions, setRevisions] = useState(0);
  const startTime = useRef(Date.now());

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newItems = [...orderedItems];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, moved);
    setOrderedItems(newItems);
    setDragIndex(index);
    setRevisions((r) => r + 1);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function handleSubmit() {
    onComplete({
      order: orderedItems.map((item) => item.id),
      timeMs: Date.now() - startTime.current,
      revisions,
    });
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Priority Snap
      </h2>
      <p
        className="flex items-center gap-2 mb-6 text-base"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowUpDown size={16} aria-hidden="true" style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        Drag these tasks into priority order — highest priority at the top.
      </p>
      <div className="space-y-2 mb-8">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className="glass-card flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing select-none"
            style={{
              borderLeft: `4px solid var(--accent)`,
              boxShadow:
                dragIndex === index
                  ? "var(--shadow-glow)"
                  : "var(--shadow-md)",
              transform: dragIndex === index ? "scale(1.02)" : "scale(1)",
              borderColor:
                dragIndex === index ? "var(--accent)" : undefined,
              transition: "box-shadow var(--transition-fast), transform var(--transition-fast)",
            }}
          >
            {/* Number badge */}
            <span
              className="flex items-center justify-center w-7 h-7 text-sm font-bold shrink-0"
              style={{
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--accent)",
                color: "var(--text-inverse)",
              }}
            >
              {index + 1}
            </span>
            <span
              className="flex-1 font-medium text-base"
              style={{ color: "var(--text-primary)" }}
            >
              {item.label}
            </span>
            {/* Drag handle */}
            <GripVertical
              size={20}
              aria-hidden="true"
              style={{ color: "var(--text-muted)", flexShrink: 0 }}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        className="btn-cta w-full py-3 text-base font-bold"
        style={{ borderRadius: "var(--radius-full)" }}
      >
        Lock In Order
      </button>
    </div>
  );
}
