"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "var(--radius-md)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
