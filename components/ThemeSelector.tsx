"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { COLOR_THEME_OPTIONS, applyColorTheme, readStoredColorTheme, ColorThemeId } from "@/lib/color-theme";
import { Palette, Moon, Sun, Monitor } from "lucide-react";

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ColorThemeId>("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setColorTheme(readStoredColorTheme());
  }, []);

  const handleColorChange = (id: ColorThemeId) => {
    applyColorTheme(id);
    setColorTheme(id);
  };

  if (!mounted) return null;

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors border border-border"
        aria-label="Theme Settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Color Theme</p>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleColorChange(option.id)}
                    className={`text-xs px-2 py-1.5 rounded-md text-left transition-colors border ${
                      colorTheme === option.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground hover:bg-muted border-border"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Mode</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md border transition-colors ${
                    theme === "light"
                      ? "bg-primary/10 text-primary border-primary/50"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-[10px]">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md border transition-colors ${
                    theme === "dark"
                      ? "bg-primary/10 text-primary border-primary/50"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-[10px]">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md border transition-colors ${
                    theme === "system"
                      ? "bg-primary/10 text-primary border-primary/50"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-[10px]">System</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
