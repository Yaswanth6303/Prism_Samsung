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
import { SocialAuthButtons } from "@/components/web/social-auth";
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
      <SocialAuthButtons
        signInWithGoogle={signInWithGoogle}
        signInWithGithub={signInWithGithub}
        isGoogleLoading={isGoogleLoading}
        isGithubLoading={isGithubLoading}
        lastUsedMethod={lastUsedMethod as "google" | "github" | undefined}
      />

      {/* Divider */}
      <div className="relative my-4 flex items-center">
        <Separator className="flex-1" />
        <span className="px-4 text-sm text-muted-foreground">
          Or continue with email
        </span>
        <Separator className="flex-1" />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-foreground hover:text-foreground/80"
                  >
                    Forgot password?
                  </Link>
                </div>
              </Field>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={anyLoading}
            className="mt-1 h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90"
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
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Sign up
        </Link>
      </p>

      {/* Terms Footer */}
      <p className="mt-2 text-center text-sm text-muted-foreground">
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
