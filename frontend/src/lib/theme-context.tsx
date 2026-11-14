"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isAnimating: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  registerAnimationTrigger: (trigger: (targetTheme: Theme, onMidpoint: () => void, onComplete: () => void) => void) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "tijori_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTriggerRef = useRef<((targetTheme: Theme, onMidpoint: () => void, onComplete: () => void) => void) | null>(null);

  // Initialize theme on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored === "dark" || stored === "light") {
        setThemeState(stored);
        if (stored === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    } catch {
      // Fallback to light
    }
  }, []);

  const applyThemeToDOM = (newTheme: Theme) => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  const registerAnimationTrigger = useCallback(
    (trigger: (targetTheme: Theme, onMidpoint: () => void, onComplete: () => void) => void) => {
      animationTriggerRef.current = trigger;
    },
    []
  );

  const toggleTheme = useCallback(() => {
    if (isAnimating) return; // Prevent concurrent clicks

    const nextTheme: Theme = theme === "light" ? "dark" : "light";

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !animationTriggerRef.current) {
      // Instant transition
      setThemeState(nextTheme);
      applyThemeToDOM(nextTheme);
      return;
    }

    // Trigger Symbiote Animation
    setIsAnimating(true);
    animationTriggerRef.current(
      nextTheme,
      // Midpoint: screen is 100% covered by symbiote material
      () => {
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
      },
      // On Complete: symbiote has fully retracted/dissolved
      () => {
        setIsAnimating(false);
      }
    );
  }, [theme, isAnimating]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme === theme || isAnimating) return;
      toggleTheme();
    },
    [theme, isAnimating, toggleTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isAnimating,
        toggleTheme,
        setTheme,
        registerAnimationTrigger,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
