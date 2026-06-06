import { Resend } from "resend";

// A single shared mail client keeps outbound email setup consistent across the app.
export const resend = new Resend(process.env.RESEND_API_KEY);
