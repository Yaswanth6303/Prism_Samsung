"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Check, LoaderIcon, Pencil, User, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api/fetch";
import { authClient } from "@/lib/auth/client";
import { ProfileResponseSchema } from "@/types/api";

type PersonalInfoCardProps = {
  user: {
    name?: string | null;
    email: string;
    emailVerified?: boolean | null;
  };
};

export function PersonalInfoCard({ user }: PersonalInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [focusField, setFocusField] = useState<"github" | "leetcode" | null>(null);
  const githubInputRef = useRef<HTMLInputElement>(null);
  const leetcodeInputRef = useRef<HTMLInputElement>(null);

  // Username fields are loaded from the profile API so edit mode starts from the current server values.
  const loadProfileData = useCallback(async () => {
    try {
      const data = await apiFetch("/api/profile", ProfileResponseSchema, {
        cache: "no-store",
      });
      setGithubUsername(data.profile.githubUsername || "");
      setLeetcodeUsername(data.profile.leetcodeUsername || "");
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (!isEditing || !focusField) {return;}
    const ref = focusField === "github" ? githubInputRef : leetcodeInputRef;
    ref.current?.focus();
    setFocusField(null);
  }, [isEditing, focusField]);

  const handleStartEditing = () => {
    setName(user.name || "");
    setIsEditing(true);
  };

  // Inline "Set username" buttons jump straight into edit mode with the chosen field focused.
  const handleStartEditingField = (field: "github" | "leetcode") => {
    handleStartEditing();
    setFocusField(field);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setName("");
    void loadProfileData();
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      // Route name through Better Auth so the reactive session updates and the avatar card re-renders.
      // App-specific fields (github/leetcode usernames) go through our profile API.
      const [userResult] = await Promise.all([
        authClient.updateUser({ name: trimmedName }),
        apiFetch("/api/profile", ProfileResponseSchema, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            githubUsername: githubUsername.trim(),
            leetcodeUsername: leetcodeUsername.trim(),
          }),
        }),
      ]);

      if (userResult.error) {
        throw new Error(userResult.error.message || "Failed to update name");
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      await loadProfileData();
    } catch (error) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your personal details and account information.
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEditing}
              className="gap-1.5 cursor-pointer"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEditing}
                disabled={isSaving}
                className="gap-1.5 cursor-pointer"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <LoaderIcon className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Full Name</Label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="h-10"
              />
            ) : (
              <p className="text-sm font-medium">{user.name || "Not set"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Email Address</Label>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{user.email}</p>
              {user.emailVerified && <Check className="size-3.5 text-emerald-500" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">GitHub Username</Label>
            {isEditing && (
              <Input
                ref={githubInputRef}
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="your-github-username"
                className="h-10"
              />
            )}
            {!isEditing && githubUsername && (
              <p className="text-sm font-medium">{githubUsername}</p>
            )}
            {!isEditing && !githubUsername && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartEditingField("github")}
                className="h-8 gap-1.5 cursor-pointer text-xs"
              >
                <Pencil className="size-3" />
                Set GitHub username
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">LeetCode Username</Label>
            {isEditing && (
              <Input
                ref={leetcodeInputRef}
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="your-leetcode-username"
                className="h-10"
              />
            )}
            {!isEditing && leetcodeUsername && (
              <p className="text-sm font-medium">{leetcodeUsername}</p>
            )}
            {!isEditing && !leetcodeUsername && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStartEditingField("leetcode")}
                className="h-8 gap-1.5 cursor-pointer text-xs"
              >
                <Pencil className="size-3" />
                Set LeetCode username
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
