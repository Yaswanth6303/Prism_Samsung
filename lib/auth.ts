import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { lastLoginMethod } from "better-auth/plugins";
import { emailOTP } from "better-auth/plugins/email-otp";
import { db } from "@/db";
import { resend } from "@/lib/resend";
import { getResetPasswordEmail } from "@/components/emails/reset-password";
import { getVerifyEmailEmail } from "@/components/emails/verify-email";
import { getOTPEmail } from "@/components/emails/otp";

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL as string,
        to: user.email,
        subject: "Reset your password",
        html: getResetPasswordEmail({ name: user.name || "there", url }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      console.log(`[Email Verification] Sending to: ${user.email}, URL: ${url}`);
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL as string,
        to: user.email,
        subject: "Verify your email address",
        html: getVerifyEmailEmail({ name: user.name || "there", url }),
      });
      if (error) {
        console.error("[Email Verification] Failed:", error);
      } else {
        console.log("[Email Verification] Sent successfully, ID:", data?.id);
      }
    },
  },
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  plugins: [
    lastLoginMethod(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL as string,
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
