export const THEME_OPTIONS = [
  { id: "green", label: "Green", hint: "Default" },
  { id: "pink", label: "Pink", hint: "Soft rose" },
  { id: "dark", label: "Dark", hint: "Low light" },
] as const;

export type ThemeId = (typeof THEME_OPTIONS)[number]["id"];

export const DEFAULT_THEME: ThemeId = "green";
const STORAGE_KEY = "writerly-theme";

export function isThemeId(value: string | null): value is ThemeId {
  return THEME_OPTIONS.some((theme) => theme.id === value);
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: ThemeId) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}
