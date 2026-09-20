"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "indesy-theme";
const THEME_EVENT = "indesy-theme-change";
const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: "dark",
  setTheme: () => undefined,
});

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_MEDIA_QUERY).matches ? "dark" : "light";
}

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // A blocked storage API must not prevent system-theme resolution.
  }

  return systemTheme();
}

function subscribe(callback: () => void) {
  const media = window.matchMedia(DARK_MEDIA_QUERY);
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((value: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // The in-memory theme still applies when storage is unavailable.
    }

    applyTheme(value);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const context = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={context}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
