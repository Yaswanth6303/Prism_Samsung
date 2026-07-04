import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { lastLoginMethod } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";

import { getOTPEmail } from "@/components/emails/otp";
import { getResetPasswordEmail } from "@/components/emails/reset-password";
import { getVerifyEmailEmail } from "@/components/emails/verify-email";
import { db } from "@/lib/db/mongo-client";
import { env } from "@/lib/env";
import { resend } from "@/lib/integrations/resend";

// Central auth config keeps sign-in, verification, and password reset behavior in one place.
export const auth = betterAuth({
  // MongoDB is the source of truth for users and linked accounts.
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Reset your password",
        html: getResetPasswordEmail({ name: user.name || "there", url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    // The verification email is generated from a shared template so product copy stays consistent.
    sendVerificationEmail: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: "Verify your email address",
        html: getVerifyEmailEmail({ name: user.name || "there", url }),
      });
      if (error) {
        console.error("[Email Verification] Failed:", error);
      }
    },
  },
  account: {
    accountLinking: {
      // Google and GitHub are trusted because the app uses them for profile sync.
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    // Track the last sign-in method so the UI can explain how the account was used.
    lastLoginMethod(),
    // OTP email login is a separate path, so we keep its config close to the rest of auth.
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: email,
          subject: "Your verification code",
          html: getOTPEmail({ otp }),
        });
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
