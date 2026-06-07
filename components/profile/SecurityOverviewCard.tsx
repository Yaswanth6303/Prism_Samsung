"use client";

import { Mail, Shield } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SecurityOverviewCardProps = {
  emailVerified?: boolean | null;
};

export function SecurityOverviewCard({ emailVerified }: SecurityOverviewCardProps) {
  return (
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
                {emailVerified ? "Your email has been verified" : "Email not yet verified"}
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
  );
}
