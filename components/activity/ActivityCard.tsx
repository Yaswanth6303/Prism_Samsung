import { Code2, Dumbbell, Footprints, BookOpen, Briefcase } from "lucide-react";

import type { ActivityCardProps} from "@/types";

import { GithubIcon } from "../icons/GithubIcon";

// Each activity card packages the icon, title, points, and date into one compact history row.

export function ActivityCard({ activity }: ActivityCardProps) {
  // Different activity types get different icons so the list is readable at a glance.
  const getIcon = () => {
    switch (activity.type) {
      case "github":
        return <GithubIcon className="w-5 h-5 text-foreground/70" />;
      case "leetcode":
        return <Code2 className="w-5 h-5 text-foreground/70" />;
      case "gym":
        return <Dumbbell className="w-5 h-5 text-foreground/70" />;
      case "jogging":
        return <Footprints className="w-5 h-5 text-foreground/70" />;
      case "study":
        return <BookOpen className="w-5 h-5 text-foreground/70" />;
      case "project":
        return <Briefcase className="w-5 h-5 text-foreground/70" />;
      default:
        return null;
    }
  };

  // The background tint is a small visual cue that helps distinguish categories without extra text.
  const getColor = () => {
    switch (activity.type) {
      case "github":
        return "bg-purple-100/60 dark:bg-purple-900/30";
      case "leetcode":
        return "bg-yellow-100/60 dark:bg-yellow-900/30";
      case "gym":
        return "bg-red-100/60 dark:bg-red-900/30";
      case "jogging":
        return "bg-green-100/60 dark:bg-green-900/30";
      case "study":
        return "bg-blue-100/60 dark:bg-blue-900/30";
      case "project":
        return "bg-indigo-100/60 dark:bg-indigo-900/30";
      default:
        return "bg-muted";
    }
  };

  // Human-friendly date labels make recent activity feel immediate.
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date("2026-04-30");
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-muted/60 transition-colors">
      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getColor()}`}>{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs sm:text-sm text-foreground truncate">{activity.title}</p>
        {activity.details && <p className="text-xs text-muted-foreground truncate">{activity.details}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm sm:text-base font-semibold text-blue-600">+{activity.points}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(activity.date)}</p>
      </div>
    </div>
  );
}
