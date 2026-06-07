"use client";
import { useEffect, useCallback } from "react";

import { driver } from "driver.js";

import "driver.js/dist/driver.css";
import { usePathname, useRouter } from "next/navigation";

// The onboarding tour teaches the app in small, page-specific steps instead of dumping everything at once.
export const TOUR_KEY = "tour_v1";   // bump to reset for all users
const TOUR_ACTIVE = "tour_active";   // "true" while tour is running
const TOUR_PAGE_IDX = "tour_page_idx"; // index into TOUR_FLOW

const TOUR_FLOW: {
  path: string;
  steps: () => NonNullable<Parameters<typeof driver>[0]>["steps"];
}[] = [
  {
    path: "/dashboard",
    steps: () => [
      {
        popover: {
          title: "👋 Welcome to Productivity Tracker!",
          description:
            "This quick tour will guide you through the whole app. Click Next to continue or × to exit.",
        },
      },
      {
        element: "#tour-dashboard-stats",
        popover: {
          title: "📊 Your Stats",
          description:
            "Total points, streaks, and college rank — always live.",
        },
      },
      {
        element: "#tour-streak-calendar",
        popover: {
          title: "🔥 Activity Calendar",
          description:
            "Days marked with 🔥 mean you were active. Click any date to see what you logged.",
        },
      },
      {
        element: "#tour-nav-profile",
        popover: {
          title: "⚙️ Up next: Profile",
          description: "Let's set up your account first so we can track your progress.",
          nextBtnText: "Go to Profile →",
        },
      },
    ],
  },
  {
    path: "/profile",
    steps: () => [
      {
        element: "#tour-profile-usernames",
        popover: {
          title: "🔗 Link Your Accounts",
          description:
            "Enter your GitHub and LeetCode usernames so Prism can track your contributions automatically.",
        },
      },
      {
        element: "#tour-api-keys",
        popover: {
          title: "🔑 AI Provider Keys",
          description:
            "Add your OpenAI, Anthropic, or Gemini key to power ClawMind. Keys are securely encrypted.",
        },
      },
      {
        element: "#tour-pats",
        popover: {
          title: "🔐 Personal Access Tokens",
          description:
            "For full GitHub history and accurate streaks, add a GitHub PAT here.",
          nextBtnText: "Go to Study →",
        },
      },
    ],
  },
  {
    path: "/study",
    steps: () => [
      {
        element: "#tour-study-subjects",
        popover: {
          title: "📚 AI Study Assistant",
          description:
            "Organize your materials by subject. Click a subject to view your notes.",
        },
      },
      {
        element: "#tour-study-new-subject",
        popover: {
          title: "➕ Create a Subject",
          description:
            "Start by creating a subject here. Then you can generate AI notes, quizzes, and use the whiteboard!",
          nextBtnText: "Go to Activities →",
        },
      },
    ],
  },
  {
    path: "/activities",
    steps: () => [
      {
        element: "#tour-activities-add",
        popover: {
          title: "➕ Log an Activity",
          description:
            "Once you connect GitHub and LeetCode in your profile, that data syncs automatically! For other activities like gym, jogging, or custom projects, log them manually here.",
          nextBtnText: "Go to Leaderboard →",
        },
      },
    ],
  },
  {
    path: "/leaderboard",
    steps: () => [
      {
        element: "#tour-leaderboard",
        popover: {
          title: "🏆 Leaderboard",
          description:
            "See how you rank against your peers. Your rank updates automatically as you log activities.",
          nextBtnText: "Finish Tour 🎉",
        },
      },
    ],
  },
];

// These helpers keep the tour state readable in localStorage without spreading storage logic through the component.
function isFirstVisit() {
  return !localStorage.getItem(TOUR_KEY);
}
function isTourActive() {
  return localStorage.getItem(TOUR_ACTIVE) === "true";
}
function getTourPageIdx() {
  return parseInt(localStorage.getItem(TOUR_PAGE_IDX) ?? "0", 10);
}
function setTourState(active: boolean, pageIdx: number) {
  if (active) {
    localStorage.setItem(TOUR_ACTIVE, "true");
    localStorage.setItem(TOUR_PAGE_IDX, String(pageIdx));
  } else {
    localStorage.removeItem(TOUR_ACTIVE);
    localStorage.removeItem(TOUR_PAGE_IDX);
    localStorage.setItem(TOUR_KEY, "done"); // prevent auto-start next visit
  }
}

// The component itself does not render visible UI; it just drives the walkthrough when the page is ready.
export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();

  const runTourForPage = useCallback(
    (pageIdx: number) => {
      const page = TOUR_FLOW[pageIdx];
      if (!page) {return;}

      // Each page owns its own steps so the tour stays aligned with the actual screen the user sees.
      const steps = page.steps();
      const isLastPage = pageIdx === TOUR_FLOW.length - 1;
      let completedNaturally = false;

      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        steps,
        onNextClick: () => {
          if (driverObj.isLastStep()) {
            completedNaturally = true;
            driverObj.destroy();
          } else {
            driverObj.moveNext();
          }
        },
        onPrevClick: () => {
          if (driverObj.isFirstStep()) {
            if (pageIdx > 0) {
              completedNaturally = true; // Pretend it completed naturally so it doesn't cancel the entire tour
              driverObj.destroy();
              const prevIdx = pageIdx - 1;
              setTourState(true, prevIdx);
              router.push(TOUR_FLOW[prevIdx].path);
            }
          } else {
            driverObj.movePrevious();
          }
        },
        onDestroyed: () => {
          if (!completedNaturally) {
            // User pressed × / Esc — cancel the whole tour
            setTourState(false, 0);
            return;
          }
          if (isLastPage) {
            setTourState(false, 0); // tour done
          } else {
            const nextIdx = pageIdx + 1;
            setTourState(true, nextIdx);
            router.push(TOUR_FLOW[nextIdx].path);
          }
        },
      });

      driverObj.drive();
    },
    [router]
  );

  // Auto-start on the first visit, or resume when the tour navigates the user between pages.
  useEffect(() => {
    // The very first visit should start on the dashboard because that is where the app story begins.
    if (isFirstVisit()) {
      const t = setTimeout(() => {
        if (pathname === TOUR_FLOW[0].path) {
          setTourState(true, 0);
          runTourForPage(0);
        } else {
          setTourState(true, 0);
          router.push(TOUR_FLOW[0].path);
        }
      }, 1000);
      return () => clearTimeout(t);
    }

    // If the tour is already active, wait for the correct page before showing the next set of tips.
    if (isTourActive()) {
      const idx = getTourPageIdx();
      if (TOUR_FLOW[idx]?.path === pathname) {
        const t = setTimeout(() => runTourForPage(idx), 700);
        return () => clearTimeout(t);
      }
    }
  }, [pathname, router, runTourForPage]);

  // The replay listener lets the navbar restart the tour without coupling the two components.
  useEffect(() => {
    function handleReplay() {
      setTourState(true, 0);
      if (pathname === TOUR_FLOW[0].path) {
        // Already on the starting page, so the tour can begin right away.
        runTourForPage(0);
      } else {
        // Navigate back to the start and let the first effect resume the walkthrough.
        router.push(TOUR_FLOW[0].path);
      }
    }
    window.addEventListener("prism:replay-tour", handleReplay);
    return () => window.removeEventListener("prism:replay-tour", handleReplay);
  }, [pathname, router, runTourForPage]);

  return null;
}
