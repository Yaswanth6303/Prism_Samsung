"use client";

import { useEffect } from "react";

import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";

import { ConnectedAccountsCard } from "@/components/profile/ConnectedAccountsCard";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { ProfileIdentityCard } from "@/components/profile/ProfileIdentityCard";
import { SecurityOverviewCard } from "@/components/profile/SecurityOverviewCard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

// Profile is the user's identity hub: avatar, personal info, security, and linked accounts.
export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  // Surface link errors and successes after the OAuth round-trip, then strip the query params
  // so a refresh doesn't re-trigger the toast.
  useEffect(() => {
    if (typeof window === "undefined") {return;}
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const linked = params.get("linked");
    if (!error && !linked) {return;}

    if (error) {
      const message =
        error === "account_already_linked_to_different_user"
          ? "That account is already linked to another user. Sign in with it directly, or remove the duplicate user first."
          : `Failed to link account: ${error.replace(/_/g, " ")}`;
      toast.error(message);
    } else if (linked) {
      toast.success(`${linked.charAt(0).toUpperCase() + linked.slice(1)} connected.`);
    }

    params.delete("error");
    params.delete("linked");
    const next = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${next ? `?${next}` : ""}`,
    );
  }, []);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileIdentityCard user={session.user} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard user={session.user} />
            <SecurityOverviewCard emailVerified={session.user.emailVerified} />
            <ConnectedAccountsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
