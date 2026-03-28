import { useLayoutEffect } from "react";
import { useAppStore } from "@/store/app.store";

/**
 * Keeps the root html class in sync with the UI theme mode.
 */
export function ThemeSync() {
  const themeMode = useAppStore((state) => state.themeMode);

  useLayoutEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", themeMode === "dark");
    root.classList.toggle("light", themeMode === "light");
    root.style.colorScheme = themeMode;
  }, [themeMode]);

  return null;
}
