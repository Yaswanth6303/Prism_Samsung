"use client";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/app/schemas/auth";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { getResetPasswordErrorMessage } from "@/errors/auth";
import { CheckCircle, Eye, EyeOff, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema as any),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      await authClient.resetPassword(
        {
          newPassword: data.password,
          token,
        },
        {
          onSuccess: () => {
            setIsReset(true);
            toast.success("Password reset successfully!");
          },
          onError: (ctx) => {
            const message = getResetPasswordErrorMessage(ctx.error);
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

  // No token provided
  if (!token) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Invalid Link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="mt-4 block text-center text-sm font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  // Password successfully reset
  if (isReset) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Password Reset</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
        </div>

        <Link href="/login">
          <Button className="h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90">
            Go to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
          {/* New Password */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">New Password</FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter new password"
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
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-11 rounded-lg px-3 pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            {isLoading ? <LoaderIcon className="size-4 animate-spin" /> : "Reset Password"}
          </Button>
        </FieldGroup>
      </form>

      {/* Back to login */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-foreground/80"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
