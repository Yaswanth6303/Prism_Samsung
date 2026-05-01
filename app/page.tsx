import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center bg-black overflow-x-hidden">
      {/* Hero Content */}
      <section className="relative w-full pt-24 pb-16 md:pt-40">
        <div className="container px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            ProductivityHub
          </h1>
          <p className="mt-6 max-w-[650px] mx-auto text-zinc-400 text-lg md:text-xl font-medium">
            The elite workspace for MCA students. Track placement prep, 
            dominate the leaderboard, and solve challenges together.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
  {/* Primary Button: Sign Up */}
  <Link href="/signup">
    <Button 
      size="lg" 
      className="h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95"
    >
      Get Started Now <ArrowRight className="ml-2 size-5" />
    </Button>
  </Link>

  {/* Secondary Button: Login */}
  <Link href="/login">
    <Button 
      size="lg" 
      variant="outline"
      className="h-14 px-10 rounded-full border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white hover:bg-zinc-900 text-lg font-semibold transition-all active:scale-95"
    >
      Login to Account
    </Button>
  </Link>
</div>
        </div>
      </section>

      {/* Hero Image Section with Ambient Glow */}
      <section className="w-full max-w-6xl px-4 pb-32">
        <div className="relative group">
          {/* Ambient Purple/Blue Glow behind the dashboard */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-15 group-hover:opacity-25 transition duration-1000"></div>
          
          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-zinc-800/50">
              <Image
                src="/home.png"
                alt="ProductivityHub Dashboard Preview"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}