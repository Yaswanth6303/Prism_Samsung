"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, LoaderIcon, Mail, Shield, User, Calendar, X, Pencil, Eye, EyeOff, Save, Settings } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [name, setName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState<string | null>(null);


  const fetchLinkedAccounts = useCallback(async () => {
    try {
      const res = await authClient.listAccounts();
      if (res.data) {
        setLinkedAccounts(res.data.map((a) => a.providerId));
      }
    } catch {
      // silently fail
    }
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json?.ok && json.profile) {
          setGithubUsername(json.profile.githubUsername || '')
          setLeetcodeUsername(json.profile.leetcodeUsername || '')
        }
      }
    } catch {
      // silently fail
    }
  }, [])


  useEffect(() => {
    if (session) {
      fetchLinkedAccounts();
      loadProfileData();
    }
  }, [session, fetchLinkedAccounts, loadProfileData]);

  const handleLinkAccount = async (provider: "google" | "github") => {
    setIsLinking(provider);
    try {
      await authClient.linkSocial({ provider, callbackURL: "/profile" });
    } catch {
      toast.error(`Failed to link ${provider}. Please try again.`);
      setIsLinking(null);
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

  const handleStartEditing = () => {
    setName(session?.user?.name || "");
    setGithubUsername(githubUsername);
    setLeetcodeUsername(leetcodeUsername);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setName("");
    setGithubUsername("");
    setLeetcodeUsername("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          githubUsername: githubUsername.trim(),
          leetcodeUsername: leetcodeUsername.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to update profile')
      
      toast.success("Profile updated successfully");
      setIsEditing(false);
      await loadProfileData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await authClient.updateUser({
          image: base64,
        });
        toast.success("Avatar updated successfully");
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to update avatar");
      setIsUploadingAvatar(false);
    }
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  

  if (isPending) {
    return (
      <div>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <div className="flex items-center justify-center py-32">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Not Authenticated</CardTitle>
              <CardDescription>Please sign in to view your profile.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column — Avatar Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="flex flex-col items-center pt-2">
                {/* Avatar with Upload Overlay */}
                <div className="group relative">
                  <Avatar className="size-28 ring-4 ring-background shadow-lg">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl font-semibold bg-muted">
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload Overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <LoaderIcon className="size-5 animate-spin text-white" />
                    ) : (
                      <Camera className="size-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* Name & Email */}
                <div className="mt-4 text-center">
                  <h2 className="text-lg font-semibold">{session.user.name || "Unnamed User"}</h2>
                  <p className="text-sm text-muted-foreground">{session.user.email}</p>
                </div>

                {/* Verified Badge */}
                {session.user.emailVerified && (
                  <Badge variant="secondary" className="mt-3 gap-1">
                    <Check className="size-3" />
                    Email Verified
                  </Badge>
                )}

                {/* Quick Stats */}
                <Separator className="my-4 w-full" />
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Member since</p>
                      <p className="font-medium">{formatDate(session.user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
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
                  {/* Full Name */}
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
                      <p className="text-sm font-medium">{session.user.name || "Not set"}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{session.user.email}</p>
                      {session.user.emailVerified && (
                        <Check className="size-3.5 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  {/* GitHub Username */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">GitHub Username</Label>
                    {isEditing ? (
                      <Input
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="your-github-username"
                        className="h-10"
                      />
                    ) : (
                      <p className="text-sm font-medium">{githubUsername || "Not set"}</p>
                    )}
                  </div>

                  {/* LeetCode Username */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">LeetCode Username</Label>
                    {isEditing ? (
                      <Input
                        value={leetcodeUsername}
                        onChange={(e) => setLeetcodeUsername(e.target.value)}
                        placeholder="your-leetcode-username"
                        className="h-10"
                      />
                    ) : (
                      <p className="text-sm font-medium">{leetcodeUsername || "Not set"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="size-4" />
                  Security Overview
                </CardTitle>
                <CardDescription>A quick glance at your account security status.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="rounded-full bg-muted p-2">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email Verification</p>
                      <p className="text-xs text-muted-foreground">
                        {session.user.emailVerified
                          ? "Your email has been verified"
                          : "Email not yet verified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="rounded-full bg-muted p-2">
                      <Shield className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Password</p>
                      <p className="text-xs text-muted-foreground">
                        Manage your password in Settings
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            

            {/* Connected Accounts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-4" />
                  Connected Accounts
                </CardTitle>
                <CardDescription>Social accounts linked to your profile.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Google */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" className="size-5">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">
                          {linkedAccounts.includes("google")
                            ? "Connected to your Google account"
                            : "Sign in with Google"}
                        </p>
                      </div>
                    </div>
                    {linkedAccounts.includes("google") ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        <Check className="size-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkAccount("google")}
                        disabled={isLinking !== null}
                        className="cursor-pointer text-xs"
                      >
                        {isLinking === "google" ? (
                          <LoaderIcon className="size-3 animate-spin mr-1" />
                        ) : null}
                        Connect
                      </Button>
                    )}
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium">GitHub</p>
                        <p className="text-xs text-muted-foreground">
                          {linkedAccounts.includes("github")
                            ? "Connected to your GitHub account"
                            : "Sign in with GitHub"}
                        </p>
                      </div>
                    </div>
                    {linkedAccounts.includes("github") ? (
                      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                        <Check className="size-3" />
                        Connected
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkAccount("github")}
                        disabled={isLinking !== null}
                        className="cursor-pointer text-xs"
                      >
                        {isLinking === "github" ? (
                          <LoaderIcon className="size-3 animate-spin mr-1" />
                        ) : null}
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

   
          </div>
        </div>
      </div>
    </div>
  );
}

