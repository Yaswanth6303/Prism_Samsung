"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, Zap, Users, Code2, BookOpen, BarChart3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─── Typewriter hook ─────────────────────────────── */
function useTypewriter(words: string[], speed: number = 80, pause: number = 2000) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const delay = deleting ? speed / 2 : charIdx === word.length ? pause : speed;

    const timer = setTimeout(() => {
      if (!deleting && charIdx < word.length) {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      } else if (!deleting && charIdx === word.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

/* ─── Animated counter hook ──────────────────────── */
function useCounter(target: number, duration: number = 1800, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ─── Particle canvas ─────────────────────────────── */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.18 + 0.04,
      opacity: Math.random(),
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.pulse += 0.012;
        s.opacity = 0.3 + Math.sin(s.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${s.opacity})`;
        ctx.fill();
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />
  );
}

/* ─── Stats row ───────────────────────────────────── */
function StatItem({
  target,
  suffix,
  label,
  started,
}: {
  target: number;
  suffix: string;
  label: string;
  started: boolean;
}) {
  const count = useCounter(target, 1800, started);
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl md:text-4xl font-black text-white tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </span>
      <span className="text-xs md:text-sm text-zinc-500 font-medium tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}

/* ─── Feature card ────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
}: {
  icon: any;
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div
      className="group relative rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 
                 hover:border-zinc-600 transition-all duration-500 hover:-translate-y-1 
                 overflow-hidden cursor-default"
    >
      {/* hover glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl`}
        style={{ background: accent, zIndex: 0 }}
      />
      <div className="relative z-10">
        <div
          className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
          style={{ background: accent }}
        >
          <Icon className="size-5 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Marquee strip ───────────────────────────────── */
const MARQUEE_ITEMS = [
  "🏆 Placement Tracker",
  "⚡ DSA Challenges",
  "👥 Study Rooms",
  "📊 Analytics Dashboard",
  "🎯 Goal Setting",
  "🔔 Smart Reminders",
  "🤝 Peer Reviews",
  "🚀 Mock Interviews",
];

function Marquee() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="relative w-full overflow-hidden py-4 border-y border-zinc-800/60">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-black to-transparent z-10" />
      <div
        className="flex gap-10 whitespace-nowrap"
        style={{
          animation: "marquee 28s linear infinite",
          width: "max-content",
        }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-zinc-500 text-sm font-medium tracking-wide">
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .anim-0 { animation: fadeInUp 0.7s ease both 0.1s; }
        .anim-1 { animation: fadeInUp 0.7s ease both 0.25s; }
        .anim-2 { animation: fadeInUp 0.7s ease both 0.4s; }
        .anim-3 { animation: fadeInUp 0.7s ease both 0.55s; }
        .anim-badge { animation: fadeIn 1s ease both 1s; }
      `}</style>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────── */
export default function LandingPage() {
  const typed = useTypewriter(
    ["placement prep.", "DSA mastery.", "leaderboard glory.", "career success."],
    75,
    1800,
  );

  /* Trigger counter when stats section enters view */
  const statsRef = useRef(null);
  const [statsStarted, setStatsStarted] = useState(false);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsStarted(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center bg-black overflow-x-hidden min-h-screen relative">
      <StarField />

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          zIndex: 0,
        }}
      />

      {/* ── HERO ── */}
      <section className="relative z-10 w-full pt-28 pb-10 md:pt-44">
        <div className="container px-4 text-center max-w-5xl mx-auto">
          {/* Eyebrow badge */}
          <div className="anim-badge inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase">
              Now live for MCA 2025 batch
            </span>
          </div>

          {/* Heading */}
          <h1 className="anim-0 text-6xl md:text-8xl font-black tracking-tight leading-[0.95] mb-6">
            <span className="bg-linear-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent">
              ProductivityHub
            </span>
          </h1>

          {/* Typewriter sub-headline */}
          <p className="anim-1 text-xl md:text-2xl font-semibold text-zinc-300 mb-4 h-8">
            Built for{" "}
            <span className="text-blue-400">
              {typed}
              <span className="animate-pulse">|</span>
            </span>
          </p>

          <p className="anim-2 mt-2 max-w-[580px] mx-auto text-zinc-500 text-base md:text-lg leading-relaxed">
            The elite workspace for MCA students — track placement prep, dominate the leaderboard,
            and solve challenges together.
          </p>

          {/* CTA buttons */}
          <div className="anim-3 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button
                size="lg"
                className="group relative h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-500
                           text-white text-lg font-bold overflow-hidden
                           shadow-[0_0_30px_rgba(37,99,235,0.45)]
                           transition-all hover:scale-105 active:scale-95
                           hover:shadow-[0_0_50px_rgba(37,99,235,0.65)]"
              >
                <span className="relative z-10 flex items-center">
                  Get Started Now
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </span>
                {/* shimmer sweep */}
                <span
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent
                             translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"
                />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-full border-zinc-700 bg-zinc-950/60
                           text-zinc-400 hover:text-white hover:bg-zinc-800/80
                           text-lg font-semibold transition-all active:scale-95
                           hover:border-zinc-500"
              >
                Login to Account
              </Button>
            </Link>
          </div>

          {/* Trust micro-copy */}
          <p className="mt-5 text-zinc-600 text-xs tracking-wide">
            Free to join · No credit card required · 2,400+ students enrolled
          </p>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="relative z-10 w-full mt-6">
        <Marquee />
      </div>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="relative z-10 w-full max-w-6xl px-4 py-16">
        <div className="relative group">
          {/* Multi-layer glow */}
          <div className="absolute -inset-px bg-linear-to-r from-blue-600 via-violet-600 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 blur-2xl" />
          <div className="absolute -inset-px bg-linear-to-r from-blue-600 via-violet-600 to-blue-600 rounded-3xl opacity-10" />

          <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950 p-3 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            {/* Top bar dots */}
            <div className="flex items-center gap-1.5 px-3 pb-2">
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
              <span className="w-3 h-3 rounded-full bg-zinc-700" />
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-zinc-800/50">
              <Image
                src="/home.png"
                alt="ProductivityHub Dashboard Preview"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
                priority
              />
              {/* glass overlay shimmer on hover */}
              <div className="absolute inset-0 bg-linear-to-tr from-blue-900/0 via-white/0 to-violet-900/0 group-hover:from-blue-900/5 group-hover:to-violet-900/5 transition-all duration-700" />
            </div>
          </div>

          {/* Floating badge — top right */}
          <div
            className="absolute -top-4 -right-2 md:right-6 flex items-center gap-2 
                       rounded-full bg-zinc-900 border border-zinc-700 px-4 py-2 shadow-xl
                       animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            <Trophy className="size-4 text-yellow-400" />
            <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">
              #1 on Leaderboard
            </span>
          </div>

          {/* Floating badge — bottom left */}
          <div
            className="absolute -bottom-4 -left-2 md:left-8 flex items-center gap-2 
                       rounded-full bg-zinc-900 border border-zinc-700 px-4 py-2 shadow-xl"
            style={{ animation: "fadeInUp 0.8s ease both 1.2s" }}
          >
            <Zap className="size-4 text-blue-400" />
            <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">
              12 problems solved today
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} className="relative z-10 w-full max-w-4xl px-4 py-12">
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-2xl border border-zinc-800/60 
                     bg-zinc-950/60 backdrop-blur px-8 py-10"
        >
          <StatItem target={2400} suffix="+" label="Students" started={statsStarted} />
          <StatItem target={18500} suffix="+" label="Problems Solved" started={statsStarted} />
          <StatItem target={94} suffix="%" label="Placement Rate" started={statsStarted} />
          <StatItem target={320} suffix="+" label="Companies" started={statsStarted} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 w-full max-w-6xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            Everything you need to <span className="text-blue-400">land your dream job</span>
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto">
            One platform. Every tool. Zero distractions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Code2}
            title="DSA Challenge Arena"
            desc="Daily challenges, weekly contests, and curated problem sets mapped to top company patterns."
            accent="rgba(37,99,235,0.15)"
          />
          <FeatureCard
            icon={Trophy}
            title="Live Leaderboard"
            desc="Compete with your batch in real-time. Rankings reset weekly to keep everyone motivated."
            accent="rgba(234,179,8,0.12)"
          />
          <FeatureCard
            icon={BarChart3}
            title="Placement Tracker"
            desc="Log applications, track interview rounds, and visualize your prep progress with smart charts."
            accent="rgba(34,197,94,0.12)"
          />
          <FeatureCard
            icon={Users}
            title="Study Rooms"
            desc="Create or join focused study sessions with peers. Built-in Pomodoro and shared task lists."
            accent="rgba(168,85,247,0.12)"
          />
          <FeatureCard
            icon={BookOpen}
            title="Resource Library"
            desc="Curated notes, cheat sheets, and company-specific interview guides — all in one place."
            accent="rgba(236,72,153,0.12)"
          />
          <FeatureCard
            icon={Zap}
            title="Smart Reminders"
            desc="AI-powered nudges based on your prep calendar. Never miss a deadline or mock interview."
            accent="rgba(6,182,212,0.12)"
          />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 w-full max-w-3xl px-4 pb-32 pt-4 text-center">
        <div className="relative rounded-3xl border border-zinc-800 bg-zinc-950/80 px-8 py-16 overflow-hidden">
          {/* background glow */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-900/20 via-transparent to-violet-900/20 pointer-events-none" />
          <h2 className="relative text-3xl md:text-5xl font-black text-white mb-4">
            Your placement journey
            <br />
            <span className="text-blue-400">starts today.</span>
          </h2>
          <p className="relative text-zinc-500 mb-8 max-w-sm mx-auto">
            Join 2,400+ MCA students already on their way to top-tier careers.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="group h-14 px-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white
                         text-lg font-bold shadow-[0_0_40px_rgba(37,99,235,0.5)]
                         transition-all hover:scale-105 active:scale-95 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Join for Free
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
