"use client";

import { useCallback, useEffect, useState } from "react";

import { LoaderIcon, Monitor } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth/client";
import type { SessionInfo } from "@/types";

// User agents are noisy, so this helper extracts just the browser and OS labels the user can understand.
function parseUserAgent(ua?: string | null) {
  if (!ua) {return { browser: "Unknown browser", os: "Unknown device" };}

  let browser = "Unknown browser";
  if (ua.includes("Firefox")) {browser = "Firefox";}
  else if (ua.includes("Edg")) {browser = "Microsoft Edge";}
  else if (ua.includes("Chrome")) {browser = "Chrome";}
  else if (ua.includes("Safari")) {browser = "Safari";}
  else if (ua.includes("Opera") || ua.includes("OPR")) {browser = "Opera";}

  let os = "Unknown device";
  if (ua.includes("Windows")) {os = "Windows";}
  else if (ua.includes("Mac")) {os = "macOS";}
  else if (ua.includes("Linux")) {os = "Linux";}
  else if (ua.includes("Android")) {os = "Android";}
  else if (ua.includes("iPhone") || ua.includes("iPad")) {os = "iOS";}

  return { browser, os };
}

function formatSessionDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type SessionsSectionProps = {
  currentSessionToken: string;
};

export function SessionsSection({ currentSessionToken }: SessionsSectionProps) {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

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

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionToken: string) => {
    setRevokingSessionId(sessionToken);
    try {
      await authClient.revokeSession({ token: sessionToken });
      toast.success("Session revoked successfully");
      void fetchSessions();
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
      void fetchSessions();
    } catch {
      toast.error("Failed to revoke sessions. Please try again.");
    } finally {
      setIsRevokingAll(false);
    }
  };

  return (
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
              const isCurrentSession = s.token === currentSessionToken;
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
  );
}
