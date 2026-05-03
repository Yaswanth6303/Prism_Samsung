"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applyColorTheme,
  COLOR_THEME_OPTIONS,
  type ColorThemeId,
  readStoredColorTheme,
} from "@/lib/color-theme";

export function ToggleColorTheme() {
  const [palette, setPalette] = useState<ColorThemeId>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPalette(readStoredColorTheme());
  }, []);

  const handleSelect = (id: ColorThemeId) => {
    applyColorTheme(id);
    setPalette(id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Color theme">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {COLOR_THEME_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.id} onSelect={() => handleSelect(opt.id)}>
            <span className="flex w-full items-center justify-between gap-4">
              {opt.label}
              {mounted && palette === opt.id ? (
                <Check className="size-4 shrink-0 opacity-70" />
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
