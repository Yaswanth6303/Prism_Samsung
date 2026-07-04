"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Home,
  Trophy,
  Activity,
  User,
  HelpCircle,
  LogOut,
  Settings,
  LoaderIcon,
  Book,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";

import { ToggleColorTheme } from "./toggle-color-theme";
import { ToggleTheme } from "./toggle-theme";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { buttonVariants, Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";




// The navbar is the main shell for navigation, auth state, and quick account actions.
export function NavBar() {
  const { data: session, isPending } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  // The onboarding tour is replayed by broadcasting a custom event that the tour component listens for.
  function handleReplayTour() {
    window.dispatchEvent(new CustomEvent("prism:replay-tour"));
  }

  // Logout centralizes the sign-out flow so desktop and mobile menus behave the same way.
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully");
            router.push("/login");
          },
        },
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // NOTE: removed automatic background platform sync on every page load.
  // Platform sync should only run when the user presses the Sync button in Activities
  // or on the user's first visit (handled in the Activities component).

  // Initials keep the avatar placeholder readable even when the user has no uploaded image.
  const getInitials = (name?: string | null) => {
    if (!name) {return "U";}
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/study", label: "Study", icon: Book },
    { href: "/activities", label: "Activities", icon: Activity },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <nav className="w-full py-4 px-4 lg:px-0 lg:py-5 flex items-center justify-between lg:grid lg:grid-cols-3">
      {/* The logo doubles as a home link so users can always recover their place. */}
      <div>
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Activity className="size-6 lg:size-7 text-blue-500" />
          <span className="text-xl lg:text-2xl font-bold tracking-tight">ClawMind</span>
        </Link>
      </div>

      {/* Desktop nav is only shown when the user is signed in because these routes are authenticated. */}
      <div className="hidden lg:flex items-center justify-center gap-1">
        {session &&
          navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              id={`tour-nav-${link.label.toLowerCase()}`}
              className={buttonVariants({ variant: "ghost" })}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
      </div>

      {/* The right side adapts to loading, signed-in, and logged-out states. */}
      <div className="flex items-center justify-end gap-2 lg:gap-3">
        {/* Theme controls are always available on desktop because they affect the entire experience. */}
        <div className="hidden lg:flex items-center gap-2">
          <ToggleTheme />
          <ToggleColorTheme />
        </div>

        {isPending && (
          <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
        )}
        {!isPending && session && (
          <>
            {/* The desktop profile menu groups account actions in one place. */}
            <div className="hidden lg:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-9 rounded-full">
                    <Avatar className="size-9">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col gap-1 px-2 py-1.5">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReplayTour} className="cursor-pointer">
                    <HelpCircle className="mr-2 size-4" />
                    Replay Page Tour
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    {isLoggingOut ? (
                      <LoaderIcon className="mr-2 size-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 size-4" />
                    )}
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile users get a sheet because it keeps the navigation compact and thumb-friendly. */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72" aria-describedby={undefined}>
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-left">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={session.user.image || undefined}
                          alt={session.user.name}
                        />
                        <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{session.user.name}</span>
                        <span className="text-xs text-muted-foreground">{session.user.email}</span>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-1 py-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <link.icon className="size-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="border-t pt-4 flex flex-col gap-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <User className="size-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Settings className="size-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      handleReplayTour();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground w-full text-left"
                  >
                    <HelpCircle className="size-4" />
                    Replay Page Tour
                  </button>

                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <ToggleTheme />
                    <ToggleColorTheme />
                  </div>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    {isLoggingOut ? (
                      <LoaderIcon className="size-4 animate-spin" />
                    ) : (
                      <LogOut className="size-4" />
                    )}
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
        {!isPending && !session && (
          <>
            {/* Logged-out visitors see signup and login as the primary calls to action. */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "ghost",
                  className:
                    "text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-full px-5 transition-all",
                })}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({
                  className:
                    "bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all active:scale-95 font-bold",
                })}
              >
                Sign up
              </Link>
            </div>

            {/* The logged-out mobile sheet keeps the same entry points without crowding the header. */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72" aria-describedby={undefined}>
                <SheetHeader className="border-b pb-4">
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-3 py-6">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <ToggleTheme />
                    <ToggleColorTheme />
                  </div>

                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500"
                  >
                    Sign up
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </nav>
  );
}
