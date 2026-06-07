"use client";

import { useState } from "react";

import { LoaderIcon, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/fetch";
import { authClient } from "@/lib/auth/client";
import { DeleteAccountResponseSchema } from "@/types/api";

export function DangerZoneSection() {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);

  // Deleting an account is intentionally noisy so the user has to spell out the destructive action.
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await apiFetch("/api/auth/delete-account", DeleteAccountResponseSchema, {
        method: "POST",
        credentials: "include",
      });

      // Drop any client-side session state before redirect; ignore failures since
      // the server already invalidated the session by clearing cookies.
      await authClient.signOut().catch(() => {});

      toast.success("Account deleted. We're sorry to see you go.");
      window.location.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
                Type{" "}
                <span className="font-mono font-semibold text-destructive">DELETE</span> to
                confirm
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
  );
}
