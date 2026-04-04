"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  /** Set true when Tooltip is a direct child of a CSS grid so it fills the cell */
  fill?: boolean;
}

export function Tooltip({ content, children, position = "top", fill }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 300);
  }

  function hide() {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: `translateX(-50%) translateY(${visible ? "0" : "4px"})` },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: `translateX(-50%) translateY(${visible ? "0" : "-4px"})` },
    left: { right: "calc(100% + 8px)", top: "50%", transform: `translateY(-50%) translateX(${visible ? "0" : "4px"})` },
    right: { left: "calc(100% + 8px)", top: "50%", transform: `translateY(-50%) translateX(${visible ? "0" : "-4px"})` },
  };

  return (
    <div
      style={{ position: "relative", display: fill ? "flex" : "inline-flex", flexDirection: "column", minWidth: 0 }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            ...positionStyles[position],
            background: "var(--bg-surface-solid)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "6px 12px",
            fontSize: 12,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "var(--shadow-md)",
            animation: "tooltipIn 150ms ease forwards",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
