import { LoaderIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SocialAuthButtonsProps } from "@/types";

import { GithubIcon } from "../icons/GithubIcon";
import { GoogleIcon } from "../icons/GoogleIcon";

// Social auth is kept in one component so login and signup can reuse the same provider buttons.
export function SocialAuthButtons({
  signInWithGoogle,
  signInWithGithub,
  isGoogleLoading,
  isGithubLoading,
  lastUsedMethod,
}: SocialAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Google gets its own loading state so the button tells the truth about the current request. */}
      <div className="relative w-full">
        <Button
          variant="outline"
          type="button"
          onClick={signInWithGoogle}
          disabled={isGoogleLoading || isGithubLoading}
          className="w-full cursor-pointer flex items-center gap-2 p-4"
        >
          {isGoogleLoading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <GoogleIcon className="w-4 h-4" />
          )}
          Continue with Google
        </Button>

        {lastUsedMethod === "google" && (
          <Badge variant="secondary" className="absolute -top-2 right-2 text-xs">
            Last used
          </Badge>
        )}
      </div>

      {/* GitHub mirrors the same layout so the two sign-in paths feel equally intentional. */}
      <div className="relative w-full">
        <Button
          variant="outline"
          type="button"
          onClick={signInWithGithub}
          disabled={isGoogleLoading || isGithubLoading}
          className="w-full cursor-pointer flex items-center gap-2 p-4"
        >
          {isGithubLoading ? (
            <LoaderIcon className="size-4 animate-spin" />
          ) : (
            <GithubIcon className="w-4 h-4" />
          )}
          Continue with GitHub
        </Button>

        {lastUsedMethod === "github" && (
          <Badge variant="secondary" className="absolute -top-2 right-2 text-xs">
            Last used
          </Badge>
        )}
      </div>
    </div>
  );
}
