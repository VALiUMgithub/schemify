import { create } from "zustand";

export type ThemeMode = "dark" | "light";

interface AppState {
  /** Whether the sidebar is expanded (true) or collapsed to icon-only (false). */
  sidebarOpen: boolean;
  /** UI theme mode persisted locally. */
  themeMode: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = "schemify.theme";

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;

  return "dark";
}

function persistThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

/**
 * Global application UI state.
 * Keep this store thin — only truly shared, cross-cutting UI state lives here.
 */
export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  themeMode: getInitialThemeMode(),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleTheme: () =>
    set((state) => {
      const nextMode: ThemeMode = state.themeMode === "dark" ? "light" : "dark";
      persistThemeMode(nextMode);
      return { themeMode: nextMode };
    }),

  setThemeMode: (mode) => {
    persistThemeMode(mode);
    set({ themeMode: mode });
  },
}));
