import { Code2, Dumbbell, Footprints, BookOpen, Briefcase } from "lucide-react";
import { GithubIcon } from "./icons/GithubIcon";
import type { Activity } from "@/types";

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const getIcon = () => {
    switch (activity.type) {
      case "github":
        return <GithubIcon className="w-5 h-5 text-gray-700" />;
      case "leetcode":
        return <Code2 className="w-5 h-5 text-gray-700" />;
      case "gym":
        return <Dumbbell className="w-5 h-5 text-gray-700" />;
      case "jogging":
        return <Footprints className="w-5 h-5 text-gray-700" />;
      case "study":
        return <BookOpen className="w-5 h-5 text-gray-700" />;
      case "project":
        return <Briefcase className="w-5 h-5 text-gray-700" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case "github":
        return "bg-purple-50";
      case "leetcode":
        return "bg-yellow-50";
      case "gym":
        return "bg-red-50";
      case "jogging":
        return "bg-green-50";
      case "study":
        return "bg-blue-50";
      case "project":
        return "bg-indigo-50";
      default:
        return "bg-gray-50";
    }
  };

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
    <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${getColor()}`}>{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-xs sm:text-sm text-gray-900 truncate">{activity.title}</p>
        {activity.details && <p className="text-xs text-gray-500 truncate">{activity.details}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm sm:text-base font-semibold text-blue-600">+{activity.points}</p>
        <p className="text-[10px] sm:text-xs text-gray-500">{formatDate(activity.date)}</p>
      </div>
    </div>
  );
}
