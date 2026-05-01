"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants, Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ToggleTheme } from "./toggle-theme";
import { authClient } from "@/lib/auth-client";
import {
  Home,
  Trophy,
  Activity,
  User,
  LogOut,
  Settings,
  LoaderIcon,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function NavBar() {
  const { data: session, isPending } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="w-full py-5 grid grid-cols-3 items-center">
      {/* Left - Logo */}
      <div>
        <Link href="/" className="flex items-center gap-2">
          <Activity className="size-7 text-blue-500" />
          <span className="text-2xl font-bold tracking-tight">
            ProductivityHub
          </span>
        </Link>
      </div>

      {/* Center - Nav Links (only visible when logged in) */}
      <div className="flex items-center justify-center gap-1">
        {session && (
          <>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              <Home className="size-4" />
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              
              <Trophy className="size-4" />
              Leaderboard
            </Link>
            <Link
        href="/discussion"
        className={buttonVariants({ variant: "ghost" })}
      >
        <MessageSquare className="size-4" /> {/* You'll need to import MessageSquare from lucide-react */}
        Discussion
      </Link>
            <Link
              href="/activities"
              className={buttonVariants({
                variant: "ghost",
              })}
            >
              <Activity className="size-4" />
              Activities
            </Link>
          </>
        )}
      </div>

      {/* Right - Auth */}
<div className="flex items-center justify-end gap-3">
  <ToggleTheme />

  {isPending ? (
    <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
  ) : session ? (
    /* 1. PROFILE DROPDOWN - This is what was missing! */
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-8 rounded-full">
          <Avatar className="size-8">
            <AvatarImage
              src={session.user.image || undefined}
              alt={session.user.name}
            />
            <AvatarFallback className="text-xs">
              {getInitials(session.user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col gap-1 px-2 py-1.5">
          <p className="text-sm font-medium">{session.user.name}</p>
          <p className="text-xs text-muted-foreground">
            {session.user.email}
          </p>
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
  ) : (
    /* 2. BEAUTIFUL BUTTONS - Shown only when logged out */
    <div className="flex items-center gap-4">
      <Link 
        href="/login" 
        className={buttonVariants({ 
          variant: "ghost",
          className: "text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-full px-5 transition-all"
        })}
      >
        Log in
      </Link>

      <Link
        href="/signup"
        className={buttonVariants({
          className: "bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all active:scale-95 font-bold"
        })}
      >
        Sign up
      </Link>
    </div>
  )}
</div>
    </nav>
  );
}
