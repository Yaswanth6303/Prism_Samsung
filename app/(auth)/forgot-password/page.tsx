"use client";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/app/schemas/auth";
import Link from "next/link";
import { getForgotPasswordErrorMessage } from "@/errors/auth";
import { ArrowLeft, CheckCircle, LoaderIcon, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema as any),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          redirectTo: "/reset-password",
        }),
        credentials: "include",
      });

      if (res.ok) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
        toast.success("Reset link sent! Check your email.");
      } else {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.error
          ? getForgotPasswordErrorMessage(errorData.error)
          : "Something went wrong. Please try again.";
        toast.error(message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                form.reset();
              }}
              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              try again
            </button>
          </p>

          <Link
            href="/login"
            className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
          {/* Email */}
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">Email</FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="john.doe@example.com"
                    type="email"
                    className="h-11 rounded-lg px-3 pr-10"
                    {...field}
                  />
                  <Mail className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
            {isLoading ? <LoaderIcon className="size-4 animate-spin" /> : "Send Reset Link"}
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
