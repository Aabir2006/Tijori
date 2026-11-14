"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme-context";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, isAnimating, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const tooltipText = isDark
    ? "Switch to Light Mode"
    : "Switch to Dark Mode";

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={toggleTheme}
        disabled={isAnimating}
        aria-label={tooltipText}
        className={`group relative flex size-9 items-center justify-center rounded-xl border border-border/80 bg-card p-0 text-foreground transition-all duration-300 hover:border-emerald-500/50 hover:bg-muted/60 hover:shadow-md cursor-pointer disabled:pointer-events-none disabled:opacity-60 outline-none ${className}`}
      >
        <div className="relative size-4 flex items-center justify-center">
          {/* Sun Icon (shown in dark mode) */}
          <Sun
            className={`size-4 text-amber-400 transition-all duration-500 ${
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "rotate-90 scale-0 opacity-0 absolute"
            }`}
          />
          {/* Moon Icon (shown in light mode) */}
          <Moon
            className={`size-4 text-slate-700 dark:text-slate-300 transition-all duration-500 ${
              isDark
                ? "-rotate-90 scale-0 opacity-0 absolute"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
        </div>
        <span className="sr-only">{tooltipText}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="text-xs font-medium">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
