"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, LoaderIcon, Mail, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

type VerifyMethod = "magic-link" | "otp";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const router = useRouter();

  const [method, setMethod] = useState<VerifyMethod>("magic-link");
  const [isResending, setIsResending] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP input when switching to OTP method
  useEffect(() => {
    if (method === "otp" && otpSent) {
      inputRefs.current[0]?.focus();
    }
  }, [method, otpSent]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address is missing.");
      return;
    }
    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Email address is missing.");
      return;
    }
    setIsSendingOTP(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newOtp.every((d) => d !== "") && value) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      verifyOTP(pasted);
    }
  };

  const verifyOTP = async (code: string) => {
    setIsVerifying(true);
    try {
      const res = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (res.error) {
        const msg =
          res.error.code === "INVALID_OTP"
            ? "Invalid code. Please try again."
            : res.error.code === "OTP_EXPIRED"
              ? "Code expired. Please request a new one."
              : res.error.message || "Verification failed. Please try again.";
        toast.error(msg);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setIsVerified(true);
        toast.success("Email verified successfully!");
        setTimeout(() => router.push("/"), 1500);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Verified success screen
  if (isVerified) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Email Verified!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email has been verified. Redirecting you...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Mail className="size-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
        {email && (
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;ve sent a verification email to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
      </div>

      {/* Method Toggle */}
      <div className="mb-6 flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setMethod("magic-link")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            method === "magic-link"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="size-4" />
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => {
            setMethod("otp");
            if (!otpSent) handleSendOTP();
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            method === "otp"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound className="size-4" />
          OTP Code
        </button>
      </div>

      {/* Magic Link View */}
      {method === "magic-link" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click the verification link in your email to verify your account and sign in
              automatically.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            variant="outline"
            className="h-11 w-full cursor-pointer rounded-lg"
          >
            {isResending ? (
              <LoaderIcon className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      )}

      {/* OTP View */}
      {method === "otp" && (
        <div className="space-y-4">
          {isSendingOTP ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <LoaderIcon className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sending OTP to your email...</p>
            </div>
          ) : otpSent ? (
            <>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Enter the 6-digit code we sent to your email.
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center gap-2" onPaste={handleOTPPaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    disabled={isVerifying}
                    className="h-12 w-12 rounded-lg text-center text-lg font-semibold"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <Button
                type="button"
                onClick={() => verifyOTP(otp.join(""))}
                disabled={isVerifying || otp.some((d) => d === "")}
                className="h-11 w-full cursor-pointer rounded-lg bg-foreground text-background hover:bg-foreground/90"
              >
                {isVerifying ? <LoaderIcon className="size-4 animate-spin" /> : "Verify Code"}
              </Button>

              {/* Resend OTP */}
              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isSendingOTP}
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Resend
                </button>
              </p>
            </>
          ) : null}
        </div>
      )}

      {/* Back to login */}
      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to login
      </Link>
    </div>
  );
}
