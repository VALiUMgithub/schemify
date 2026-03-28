import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/app.store";

export function Topbar() {
  const { toggleTheme, themeMode } = useAppStore();

  return (
    <header className="h-14 shrink-0 border-b border-border/70 bg-surface-muted/60 backdrop-blur-md backdrop-saturate-150 supports-[backdrop-filter]:bg-surface-muted/50 dark:border-border/60 dark:bg-surface-muted/55 flex items-center px-4 gap-4">
      <h1 className="text-base font-semibold text-content-primary tracking-tight">
        Schemify
      </h1>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-surface-subtle text-content-secondary hover:text-content-primary hover:border-border-strong transition-colors duration-150"
          aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
          title={
            themeMode === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {themeMode === "dark" ? (
            <Sun className="w-4 h-4" strokeWidth={2} />
          ) : (
            <Moon className="w-4 h-4" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
}
