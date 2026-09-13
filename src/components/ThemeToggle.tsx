import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "theme";

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
  localStorage.setItem(KEY, theme);
  window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(KEY) as "light" | "dark" | null;
  // Default to Dark Mode only. Switch to Light Mode only if explicitly saved by user.
  const initial = saved === "light" ? "light" : "dark";
  applyTheme(initial);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    const saved = localStorage.getItem(KEY);
    if (saved === "light") return "light";
    return "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"light" | "dark">;
      if (customEvent.detail && customEvent.detail !== theme) {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
      aria-label="Toggle theme"
      className={`h-9 w-9 rounded-xl border border-zinc-200 dark:border-white/[0.1] bg-white/80 dark:bg-[#11141b]/90 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-[#161922] transition-colors ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 animate-fade-in" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-700 animate-fade-in" />
      )}
    </Button>
  );
}
