"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Activity, User, MessageCircle } from "lucide-react";
import { ThemeSelector } from "./ThemeSelector";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", mobileLabel: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", mobileLabel: "Ranks", icon: Trophy },
    { href: "/activities", label: "Activities", mobileLabel: "Activity", icon: Activity },
    { href: "/discussion", label: "Discussion", mobileLabel: "Forum", icon: MessageCircle },
    { href: "/profile", label: "Profile", mobileLabel: "Profile", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-foreground">Claw Mind</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Theme Selector */}
            <div className="ml-4 flex items-center">
              <ThemeSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-card border-t border-border fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors ${
                isActive(item.href) ? "bg-blue-500/10 text-blue-600 dark:text-blue-500" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.mobileLabel}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
