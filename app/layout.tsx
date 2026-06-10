import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
  Inter,
  Quicksand,
  Space_Grotesk,
  Lora,
  Playfair_Display,
} from "next/font/google";

import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { COLOR_THEME_STORAGE_KEY } from "@/lib/theme/color-theme";

// Root layout sets the shared fonts, providers, and toaster used by every page.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClawMind",
  description: "Stop avoiding accountability, Boost your productivity with ClawMind",
};

// The root shell only handles app-wide concerns so page components stay focused on their own content.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${quicksand.variable} ${spaceGrotesk.variable} ${lora.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Inline boot restores the saved color theme before the page paints, so the first frame already matches the user preference.
            Inline string is mandatory here — React state isn't available before hydration; no user input flows into the script. */}
        <script
          id="color-theme-boot"
          suppressHydrationWarning
          // eslint-disable-next-line react/no-danger -- known-safe constant script, no user input
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k=${JSON.stringify(COLOR_THEME_STORAGE_KEY)};var v=localStorage.getItem(k);if(v&&v!=="default")document.documentElement.setAttribute("data-color-theme",v)}catch(e){}})()`,
          }}
        />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="flex-1 w-full flex flex-col">{children}</main>
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
