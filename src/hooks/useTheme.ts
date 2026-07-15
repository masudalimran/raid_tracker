import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "rtk_theme";

const prefersDarkSystem = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolveIsDark = (preference: ThemePreference) =>
  preference === "system" ? prefersDarkSystem() : preference === "dark";

const applyThemeClass = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark);
};

// Mirrors the inline script in index.html that applies the theme class
// before first paint — this hook just keeps React and the toggle in sync
// with it afterward.
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "system",
  );
  const [isDark, setIsDark] = useState(() => resolveIsDark(preference));

  useEffect(() => {
    const resolved = resolveIsDark(preference);
    setIsDark(resolved);
    applyThemeClass(resolved);

    if (preference !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      setIsDark(mql.matches);
      applyThemeClass(mql.matches);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    localStorage.setItem(STORAGE_KEY, next);
    setPreferenceState(next);
  }, []);

  return { preference, isDark, setPreference };
}
