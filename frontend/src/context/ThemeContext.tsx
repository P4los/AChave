"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  cycleTheme: () => void;
};

const STORAGE_KEY = "achave-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return storedTheme === "light" ||
      storedTheme === "dark" ||
      storedTheme === "system"
      ? storedTheme
      : "system";
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event?: MediaQueryListEvent) => {
      const prefersDark = event?.matches ?? mediaQuery.matches;
      setSystemTheme(prefersDark ? "dark" : "light");
    };

    syncSystemTheme();
    mediaQuery.addEventListener("change", syncSystemTheme);
    return () => mediaQuery.removeEventListener("change", syncSystemTheme);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  const cycleTheme = () => {
    const nextThemeMap: Record<ThemePreference, ThemePreference> = {
      system: "dark",
      dark: "light",
      light: "system",
    };
    setThemeState((currentTheme) => {
      const nextTheme = nextThemeMap[currentTheme];
      localStorage.setItem(STORAGE_KEY, nextTheme);
      return nextTheme;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      cycleTheme,
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe utilizarse dentro de ThemeProvider");
  }
  return context;
}
