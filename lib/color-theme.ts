export const COLOR_THEME_STORAGE_KEY = "ph-color-theme";

export const COLOR_THEME_IDS = [
  "default",
  "catppuccin",
  "bubblegum",
  "bold-tech",
  "amber-minimal",
  "amethyst-haze",
] as const;

export type ColorThemeId = (typeof COLOR_THEME_IDS)[number];

export const COLOR_THEME_OPTIONS: { id: ColorThemeId; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "catppuccin", label: "Catppuccin" },
  { id: "bubblegum", label: "Bubblegum" },
  { id: "bold-tech", label: "Bold Tech" },
  { id: "amber-minimal", label: "Amber Minimal" },
  { id: "amethyst-haze", label: "Amethyst Haze" },
];

export function applyColorTheme(id: ColorThemeId) {
  const root = document.documentElement;
  if (id === "default") {
    root.removeAttribute("data-color-theme");
    try {
      localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  root.setAttribute("data-color-theme", id);
  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function readStoredColorTheme(): ColorThemeId {
  try {
    const v = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (v && COLOR_THEME_IDS.includes(v as ColorThemeId) && v !== "default") {
      return v as ColorThemeId;
    }
  } catch {
    /* ignore */
  }
  return "default";
}
