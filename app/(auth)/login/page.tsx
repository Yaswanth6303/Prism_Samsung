"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/app/schemas/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getSignInErrorMessage } from "@/errors/auth";

import { Eye, EyeOff, LoaderIcon, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import z from "zod";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [lastUsedMethod, setLastUsedMethod] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const method = authClient.getLastUsedLoginMethod();
    setLastUsedMethod(method);
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema as any),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const anyLoading = isGoogleLoading || isGithubLoading || isLoading;

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const signInWithGithub = async () => {
    setIsGithubLoading(true);
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: () => {
            toast.success("Login successful");
            router.push("/");
          },
          onError: (ctx) => {
            const message = getSignInErrorMessage(ctx.error);
            toast.error(message);
          },
        },
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with Google, GitHub, or email
        </p>
      </div>

      {/* Social Buttons */}
      <div className="flex flex-col gap-3">
        {/* Google */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={signInWithGoogle}
            disabled={anyLoading}
            className="h-11 w-full cursor-pointer gap-2 rounded-lg"
          >
            {isGoogleLoading ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <GoogleIcon className="size-5" />
            )}
            Continue with Google
          </Button>
          {lastUsedMethod === "google" && (
            <Badge
              variant="secondary"
              className="absolute -right-2 -top-2 text-xs"
            >
              Last used
            </Badge>
          )}
        </div>

        {/* GitHub */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={signInWithGithub}
            disabled={anyLoading}
            className="h-11 w-full cursor-pointer gap-2 rounded-lg"
          >
            {isGithubLoading ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <GitHubIcon className="size-5" />
            )}
            Continue with GitHub
          </Button>
          {lastUsedMethod === "github" && (
            <Badge
              variant="secondary"
              className="absolute -right-2 -top-2 text-xs"
            >
              Last used
            </Badge>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative my-6 flex items-center">
        <Separator className="flex-1" />
        <span className="px-4 text-sm text-muted-foreground">
          Or continue with email
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          {/* Email */}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="flex items-center gap-2 text-sm font-semibold">
                  Email
                  {lastUsedMethod === "email" && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Last used
                    </Badge>
                  )}
                </FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="m@example.com"
                    type="email"
                    className="h-11 rounded-lg px-3 pr-10"
                    {...field}
                  />
                  <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Password */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="Your password"
                    type={showPassword ? "text" : "password"}
                    className="h-11 rounded-lg px-3 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-foreground hover:text-foreground/80"
                  >
                    Forgot password?
                  </Link>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={anyLoading}
            className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            {isLoading ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              "Login"
            )}
          </Button>
        </FieldGroup>
      </form>

      {/* Sign up link */}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Sign up
        </Link>
      </p>

      {/* Terms Footer */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
