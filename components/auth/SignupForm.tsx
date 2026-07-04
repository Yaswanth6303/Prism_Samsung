"use client";

import { useState, useRef, useCallback } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderIcon, Mail, Upload, User } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { signupSchema } from "@/app/schemas/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getSignUpErrorMessage } from "@/errors/auth";
import { authClient } from "@/lib/auth/client";

import type z from "zod";

// Signup collects the bare minimum needed to create an account and optionally lets the user personalize it right away.
export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // The form is set up once so validation and defaults stay aligned with the signup schema.
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      image: undefined,
    },
  });

  // Image selection is isolated because the preview needs to update before the account is actually created.
  const handleImageSelect = useCallback(
    (file: File) => {
      form.setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [form],
  );

  // Drag and drop is treated the same as clicking browse so the upload experience feels consistent.
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleImageSelect(file);
      }
    },
    [handleImageSelect],
  );

  // Submit creates the account, then sends the user straight to email verification.
  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    setIsLoading(true);
    try {
      await authClient.signUp.email(
        {
          name: data.name,
          email: data.email,
          password: data.password,
          image: imagePreview ?? undefined,
        },
        {
          onSuccess: () => {
            toast.success("Account created! Please verify your email.");
            router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          },
          onError: (ctx) => {
            const message = getSignUpErrorMessage(ctx.error);
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
      {/* The header keeps the sign-up flow direct and low-friction. */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 hover:text-foreground/80"
          >
            Login
          </Link>
        </p>
      </div>

      {/* The form is intentionally short so the user can get through account creation quickly. */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-3">
          {/* Name is collected first because it becomes the visible identity across the app. */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">Name</FieldLabel>
                <Input
                  aria-invalid={fieldState.invalid}
                  placeholder="John Doe"
                  type="text"
                  className="h-11 rounded-lg px-3"
                  {...field}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Email is the account anchor and the destination for verification messages. */}
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

          {/* The profile picture is optional, but this is the easiest place to invite personalization. */}
          <Field>
            <FieldLabel className="text-sm font-semibold">Profile Picture (Optional)</FieldLabel>
            <div className="flex items-center gap-4">
              {/* The preview box doubles as the upload drop zone so the interaction is easy to discover. */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex h-28 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-muted-foreground/50"
                }`}
              >
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    unoptimized
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <>
                    <User className="size-8 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">Click to upload</span>
                    <span className="text-[10px] text-muted-foreground/60">or drag and drop</span>
                  </>
                )}
              </button>

              {/* The browse button gives a second, more explicit upload path for users who prefer clicks. */}
              <div className="flex flex-col items-start gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="size-3.5" />
                  Browse Files
                </Button>
                <span className="text-xs text-muted-foreground">or drag & drop</span>
                <span className="text-[10px] text-muted-foreground/60">
                  Max 5MB (JPEG, PNG, WebP)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageSelect(file);
                  }
                }}
              />
            </div>
          </Field>

          {/* Password entry sits below identity fields because it is a required but less descriptive detail. */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">Password</FieldLabel>
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
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Confirm password reduces avoidable mistakes before the account is created. */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel className="text-sm font-semibold">Confirm Password</FieldLabel>
                <div className="relative">
                  <Input
                    aria-invalid={fieldState.invalid}
                    placeholder="Confirm your password"
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

          {/* The submit button stays prominent because this is the only irreversible step on the page. */}
          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90"
          >
            {isLoading ? <LoaderIcon className="size-4 animate-spin" /> : "Sign up"}
          </Button>
        </FieldGroup>
      </form>

      {/* Legal links are placed at the bottom so they do not compete with the signup action. */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
