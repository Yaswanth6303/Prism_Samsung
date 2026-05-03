"use client";

import { NavBar } from "@/components/navbar/navbar";
import { ToggleColorTheme } from "@/components/navbar/toggle-color-theme";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderIcon,
  Moon,
  Monitor,
  Palette,
  ShieldAlert,
  Sun,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import type { SessionInfo } from "@/types";

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Account type state
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Delete account state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await authClient.listSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const checkHasPassword = useCallback(async () => {
    try {
      const res = await authClient.listAccounts();
      if (res.data) {
        setHasPassword(res.data.some((a) => a.providerId === "credential"));
      }
    } catch {
      setHasPassword(null);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchSessions();
      checkHasPassword();
    }
  }, [session, fetchSessions, checkHasPassword]);

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSessionId(sessionToken);
    try {
      await authClient.revokeSession({ token: sessionToken });
      toast.success("Session revoked successfully");
      fetchSessions();
    } catch {
      toast.error("Failed to revoke session. Please try again.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    setIsRevokingAll(true);
    try {
      await authClient.revokeOtherSessions();
      toast.success("All other sessions have been revoked");
      fetchSessions();
    } catch {
      toast.error("Failed to revoke sessions. Please try again.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  const parseUserAgent = (ua?: string | null) => {
    if (!ua) return { browser: "Unknown browser", os: "Unknown device" };

    let browser = "Unknown browser";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

    let os = "Unknown device";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return { browser, os };
  };

  const formatSessionDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleChangePassword = async () => {
    if (hasPassword && !currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      if (hasPassword) {
        await authClient.changePassword(
          {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          },
          {
            onSuccess: () => {
              toast.success("Password changed successfully");
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
            onError: (ctx) => {
              switch (ctx.error.code) {
                case "INVALID_PASSWORD":
                  toast.error("Current password is incorrect.");
                  break;
                case "WEAK_PASSWORD":
                  toast.error("New password is too weak. Please use a stronger one.");
                  break;
                default:
                  toast.error(ctx.error.message || "Something went wrong. Please try again.");
              }
            },
          },
        );
      } else {
        // OAuth-only user — call set-password API directly
        const res = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword }),
          credentials: "include",
        });

        if (res.ok) {
          toast.success("Password set successfully! You can now sign in with email and password.");
          setNewPassword("");
          setConfirmPassword("");
          setHasPassword(true);
        } else {
          const data = await res.json().catch(() => null);
          toast.error(data?.message || "Something went wrong. Please try again.");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await authClient.deleteUser();
      toast.success("Account deleted. We're sorry to see you go.");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const themeOptions = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Clean and bright interface",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Easy on the eyes",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow device settings",
    },
  ];

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
        <NavBar />
        <div className="flex items-center justify-center py-32">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Not Authenticated</CardTitle>
              <CardDescription>Please sign in to access settings.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 lg:px-8">
      <NavBar />

      <div className="py-8">
        {/* Page Header */}
        <div className="mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account preferences and security.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Appearance */}
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
                  {themeOptions.map((option) => {
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

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4" />
                {hasPassword ? "Change Password" : "Set Password"}
              </CardTitle>
              <CardDescription>
                {hasPassword
                  ? "Update your password to keep your account secure. You'll be signed out of other sessions."
                  : "You signed up with a social account. Set a password to also sign in with email and password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Password — only if user already has one */}
                {hasPassword && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-destructive">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    (hasPassword && !currentPassword) ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="w-full cursor-pointer h-10"
                >
                  {isChangingPassword ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : hasPassword ? (
                    "Update Password"
                  ) : (
                    "Set Password"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="size-4" />
                    Active Sessions
                  </CardTitle>
                  <CardDescription>Manage your active sessions across devices.</CardDescription>
                </div>
                {sessions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevokeAllOtherSessions}
                    disabled={isRevokingAll}
                    className="cursor-pointer text-xs text-destructive hover:text-destructive"
                  >
                    {isRevokingAll ? <LoaderIcon className="size-3 animate-spin mr-1" /> : null}
                    Revoke All Others
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active sessions found.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => {
                    const isCurrentSession = s.token === session.session.token;
                    const { browser, os } = parseUserAgent(s.userAgent);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          isCurrentSession ? "border-emerald-200 bg-emerald-500/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-full p-2 ${
                              isCurrentSession ? "bg-emerald-500/10" : "bg-muted"
                            }`}
                          >
                            <Monitor
                              className={`size-4 ${
                                isCurrentSession ? "text-emerald-500" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {browser} on {os}
                              </p>
                              {isCurrentSession && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                >
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Current
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {s.ipAddress &&
                                s.ipAddress !== "0000:0000:0000:0000:0000:0000:0000:0000" &&
                                s.ipAddress !== "::1" &&
                                s.ipAddress !== "127.0.0.1" && (
                                  <>
                                    <span>{s.ipAddress}</span>
                                    <span>&middot;</span>
                                  </>
                                )}
                              <span>Signed in {formatSessionDate(s.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {!isCurrentSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeSession(s.token)}
                            disabled={revokingSessionId === s.token}
                            className="cursor-pointer text-xs text-destructive hover:text-destructive"
                          >
                            {revokingSessionId === s.token ? (
                              <LoaderIcon className="size-3 animate-spin" />
                            ) : (
                              "Revoke"
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="size-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that permanently affect your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteSection ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteSection(true)}
                  className="gap-2 cursor-pointer"
                >
                  <Trash2 className="size-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-destructive">Are you absolutely sure?</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This action cannot be undone. This will permanently delete your account and
                      remove all your data from our servers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Type <span className="font-mono font-semibold text-destructive">DELETE</span>{" "}
                      to confirm
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="Type DELETE"
                      className="h-10 border-destructive/30 focus-visible:border-destructive focus-visible:ring-destructive/20"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteSection(false);
                        setDeleteConfirmation("");
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmation !== "DELETE"}
                      className="gap-2 cursor-pointer"
                    >
                      {isDeleting ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Permanently Delete Account
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
