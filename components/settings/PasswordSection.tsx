"use client";

import { useCallback, useEffect, useState } from "react";

import { Eye, EyeOff, KeyRound, LoaderIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Some password flows start with social login, so we check whether a credential password exists.
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
    checkHasPassword();
  }, [checkHasPassword]);

  // Password changes are guarded with a few simple checks before the request leaves the browser.
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
                  toast.error(
                    ctx.error.message || "Something went wrong. Please try again.",
                  );
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
          toast.success(
            "Password set successfully! You can now sign in with email and password.",
          );
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

  return (
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
          {/* Current password is only shown for credential accounts because OAuth-only users do not have one yet. */}
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
              (hasPassword === true && !currentPassword) ||
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
  );
}
