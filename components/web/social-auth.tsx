import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon } from "lucide-react";
import type { SocialAuthButtonsProps } from "@/types";

export function SocialAuthButtons({
  signInWithGoogle,
  signInWithGithub,
  isGoogleLoading,
  isGithubLoading,
  lastUsedMethod,
}: SocialAuthButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Google Button */}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
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
          )}
          Continue with Google
        </Button>

        {lastUsedMethod === "google" && (
          <Badge variant="secondary" className="absolute -top-2 right-2 text-xs">Last used</Badge>
        )}
      </div>

      {/* GitHub Button */}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4"
            >
              <path
                d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.8-.26.8-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.38-1.33-1.76-1.33-1.76-1.09-.74.08-.72.08-.72 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.05.13 3 .4c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.2.69.8.57C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"
                fill="currentColor"
              />
            </svg>
          )}
          Continue with GitHub
        </Button>

        {lastUsedMethod === "github" && (
          <Badge variant="secondary" className="absolute -top-2 right-2 text-xs">Last used</Badge>
        )}
      </div>
    </div>
  );
}
