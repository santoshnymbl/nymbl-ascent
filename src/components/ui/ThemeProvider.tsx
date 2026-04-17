"use client";

import { createContext, useContext, useCallback, useEffect, useState, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("nymbl-theme") as Theme) || "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // must match server default
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = (localStorage.getItem("nymbl-theme") as Theme) || "dark";
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  // Apply on subsequent changes (not the initial mount)
  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem("nymbl-theme", theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
