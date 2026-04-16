"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-lg shadow-sm active:scale-90 transition-transform"
      suppressHydrationWarning
    >
      <span suppressHydrationWarning>{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
