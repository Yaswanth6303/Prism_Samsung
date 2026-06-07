"use client";

import { LoaderIcon } from "lucide-react";

import { NavBar } from "@/components/navbar/navbar";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { SessionsSection } from "@/components/settings/SessionsSection";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

// Settings is the control center for the account: API keys, appearance, password, sessions, and deletion.
export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();

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
    <div className="min-h-screen flex flex-col items-center w-full px-4 md:px-6 lg:px-8">
      <NavBar />

      <div className="py-8 w-full max-w-2xl">
        <div className="mb-8 max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account preferences and security.
          </p>
        </div>

        <div className="max-w-2xl space-y-6">
          <ApiKeysSection />
          <AppearanceSection />
          <PasswordSection />
          <SessionsSection currentSessionToken={session.session.token} />
          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
