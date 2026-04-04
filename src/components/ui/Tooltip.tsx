"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  function show() {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), 200);
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
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <span
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
          opacity: visible ? 1 : 0,
          zIndex: 1000,
          boxShadow: "var(--shadow-md)",
          transition: "opacity 150ms ease, transform 150ms ease",
        }}
      >
        {content}
      </span>
    </span>
  );
}
