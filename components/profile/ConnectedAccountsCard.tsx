"use client";

import { useCallback, useEffect, useState } from "react";

import { Check, LoaderIcon, User } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";

type SocialProvider = "google" | "github";

function GoogleIcon() {
  return (
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
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const PROVIDERS: Array<{
  id: SocialProvider;
  label: string;
  Icon: () => React.ReactElement;
  connectedDescription: string;
  disconnectedDescription: string;
}> = [
  {
    id: "google",
    label: "Google",
    Icon: GoogleIcon,
    connectedDescription: "Connected to your Google account",
    disconnectedDescription: "Sign in with Google",
  },
  {
    id: "github",
    label: "GitHub",
    Icon: GithubIcon,
    connectedDescription: "Connected to your GitHub account",
    disconnectedDescription: "Sign in with GitHub",
  },
];

export function ConnectedAccountsCard() {
  const [linkedAccounts, setLinkedAccounts] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);

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

  useEffect(() => {
    fetchLinkedAccounts();
  }, [fetchLinkedAccounts]);

  const handleLinkAccount = async (provider: SocialProvider) => {
    setIsLinking(provider);
    try {
      await authClient.linkSocial({
        provider,
        callbackURL: `/profile?linked=${provider}`,
        errorCallbackURL: "/profile",
      });
    } catch {
      toast.error(`Failed to link ${provider}. Please try again.`);
      setIsLinking(null);
    }
  };

  const handleUnlinkAccount = async (provider: SocialProvider) => {
    setIsUnlinking(provider);
    try {
      const res = await authClient.unlinkAccount({ providerId: provider });
      if (res.error) {
        // Better Auth refuses to remove the last sign-in method, so surface that clearly.
        toast.error(res.error.message ?? `Failed to disconnect ${provider}.`);
        return;
      }
      toast.success(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected.`,
      );
      await fetchLinkedAccounts();
    } catch {
      toast.error(`Failed to disconnect ${provider}. Please try again.`);
    } finally {
      setIsUnlinking(null);
    }
  };

  return (
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
          {PROVIDERS.map(({ id, label, Icon, connectedDescription, disconnectedDescription }) => {
            const isConnected = linkedAccounts.includes(id);
            return (
              <div
                key={id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <Icon />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? connectedDescription : disconnectedDescription}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      <Check className="size-3" />
                      Connected
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUnlinking !== null}
                          className="cursor-pointer text-xs"
                        >
                          {isUnlinking === id ? (
                            <LoaderIcon className="size-3 animate-spin mr-1" />
                          ) : null}
                          Disconnect
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect {label}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You won&apos;t be able to sign in with {label} after this. You can
                            reconnect any time.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleUnlinkAccount(id)}>
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkAccount(id)}
                    disabled={isLinking !== null}
                    className="cursor-pointer text-xs"
                  >
                    {isLinking === id ? (
                      <LoaderIcon className="size-3 animate-spin mr-1" />
                    ) : null}
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
