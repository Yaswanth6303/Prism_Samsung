import { heatmapData } from "./data/mockData";

export function ActivityHeatmap() {
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 4) return 'bg-green-400';
    if (count <= 6) return 'bg-green-600';
    return 'bg-green-700';
  };

  // Group data by weeks
  const weeks: typeof heatmapData[] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  // Get month labels
  const getMonthLabel = (weekIndex: number) => {
    const date = new Date(weeks[weekIndex][0].date);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const monthLabels: { month: string; position: number }[] = [];
  let currentMonth = '';
  weeks.forEach((week, index) => {
    const month = getMonthLabel(index);
    if (month !== currentMonth) {
      monthLabels.push({ month, position: index });
      currentMonth = month;
    }
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 overflow-x-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h2>

      <div className="min-w-max">
        {/* Month labels */}
        <div className="flex gap-[2px] mb-2 ml-8">
          {monthLabels.map(({ month, position }) => (
            <div
              key={position}
              style={{ marginLeft: position * 12 }}
              className="text-xs text-gray-500"
            >
              {month}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-[2px]">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] mr-2">
            <div className="h-[10px]"></div>
            <div className="h-[10px] text-xs text-gray-500 flex items-center">Mon</div>
            <div className="h-[10px]"></div>
            <div className="h-[10px] text-xs text-gray-500 flex items-center">Wed</div>
            <div className="h-[10px]"></div>
            <div className="h-[10px] text-xs text-gray-500 flex items-center">Fri</div>
            <div className="h-[10px]"></div>
          </div>

          {/* Weeks */}
          {weeks.slice(-52).map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[2px]">
              {week.map((day, dayIndex) => (
                <div
                  key={day.date}
                  className={`w-[10px] h-[10px] rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-gray-400 cursor-pointer transition-all`}
                  title={`${day.date}: ${day.count} activities`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
            <div className="w-3 h-3 rounded-sm bg-green-600"></div>
            <div className="w-3 h-3 rounded-sm bg-green-700"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
