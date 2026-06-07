"use client";

import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { ToggleColorTheme } from "@/components/navbar/toggle-color-theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun, description: "Clean and bright interface" },
  { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { value: "system", label: "System", icon: Monitor, description: "Follow device settings" },
] as const;

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-4" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how ProductivityHub looks on your device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-muted-foreground">Theme Mode</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all cursor-pointer hover:bg-muted/50 ${
                    isActive
                      ? "border-foreground bg-muted/50"
                      : "border-transparent bg-muted/20"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check className="size-3.5 text-foreground" />
                    </div>
                  )}
                  <div
                    className={`rounded-full p-2.5 ${
                      isActive ? "bg-foreground/10" : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-muted-foreground">Accent Color</Label>
          <div className="flex items-center justify-between gap-4 border rounded-lg p-4 bg-muted/20">
            <div>
              <p className="text-sm font-medium">Primary Theme Color</p>
              <p className="text-xs text-muted-foreground">
                Choose the main color for buttons, links, and active states.
              </p>
            </div>
            <ToggleColorTheme />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
