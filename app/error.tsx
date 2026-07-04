"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

// Catches rendering errors in the app tree. Next.js reloads this component with a `reset` fn
// so the user can try again without a hard refresh.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs pick this up; swap for an error tracker later.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred. Try again, or head back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
