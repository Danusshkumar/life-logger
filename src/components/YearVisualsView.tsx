import React, { useMemo, useState } from 'react';
import { ArrowLeft, PieChart, Tag as TagIcon, RotateCcw } from 'lucide-react';
import type { LogEntry, Tag } from '../types';

interface YearVisualsViewProps {
  logs: LogEntry[];
  availableTags: Tag[];
  selectedYear: string;
  onBack?: () => void;
}

export const YearVisualsView: React.FC<YearVisualsViewProps> = ({
  logs,
  availableTags,
  selectedYear,
  onBack,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const yr = parseInt(selectedYear, 10) || new Date().getFullYear();
  const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
  const totalDaysInYear = isLeap ? 366 : 365;

  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Days elapsed in the year up to today (excludes future dates)
  const elapsedDaysCount = useMemo(() => {
    if (yr > currentYear) return 0;
    if (yr < currentYear) return totalDaysInYear;
    // Current year: calculate days from Jan 1 up to today (inclusive)
    const startOfYear = new Date(yr, 0, 1);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = endOfToday.getTime() - startOfYear.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(totalDaysInYear, Math.max(0, diffDays));
  }, [yr, currentYear, totalDaysInYear, today]);

  const tagColorMap = useMemo(() => {
    return availableTags.reduce((acc, tag) => {
      acc[tag.name] = tag.color;
      return acc;
    }, {} as Record<string, string>);
  }, [availableTags]);

  // Check if a date string is past or current day
  const isPastOrToday = (dateStr: string) => {
    if (yr < currentYear) return true;
    if (yr > currentYear) return false;
    return dateStr <= todayStr;
  };

  // Aggregate tag statistics and logged/missed days (excluding future dates)
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let loggedDaysCount = 0;
    let totalTagOccurrences = 0;

    logs.forEach((entry) => {
      const hasActivities = entry.activities && entry.activities.length > 0;
      const hasDesc = entry.description && entry.description.trim().length > 0;
      const validDay = isPastOrToday(entry.date);

      if (validDay && (hasActivities || hasDesc)) {
        loggedDaysCount += 1;
      }
      if (hasActivities) {
        entry.activities.forEach((t) => {
          counts[t] = (counts[t] || 0) + 1;
          totalTagOccurrences += 1;
        });
      }
    });

    const missedDaysCount = Math.max(0, elapsedDaysCount - loggedDaysCount);

    const sorted = Object.entries(counts)
      .map(([name, count]) => {
        const percentOfTags = totalTagOccurrences > 0
          ? Math.round((count / totalTagOccurrences) * 100)
          : 0;
        const degrees = totalTagOccurrences > 0
          ? (count / totalTagOccurrences) * 360
          : 0;
        return {
          name,
          count,
          color: tagColorMap[name] || '#8B5CF6',
          percentOfTags,
          degrees,
          percentOfYear: Math.round((count / totalDaysInYear) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      sorted,
      totalTagOccurrences,
      loggedDaysCount,
      missedDaysCount,
      elapsedDaysCount,
      activeRate: elapsedDaysCount > 0 ? Math.round((loggedDaysCount / elapsedDaysCount) * 100) : 0,
      missedRate: elapsedDaysCount > 0 ? Math.round((missedDaysCount / elapsedDaysCount) * 100) : 0,
      maxCount: sorted[0]?.count || 1,
    };
  }, [logs, tagColorMap, elapsedDaysCount, totalDaysInYear, yr, currentYear, todayStr]);

  // Circle geometry for SVG Donut (Radius = 78, Circumference = 2 * PI * R)
  const RADIUS = 78;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  // Segments for the 360° circular donut chart
  const donutSegments = useMemo(() => {
    if (stats.totalTagOccurrences === 0) return [];

    let accumulatedOffset = 0;
    return stats.sorted.map((tag) => {
      const segmentRatio = tag.count / stats.totalTagOccurrences;
      const strokeLength = segmentRatio * CIRCUMFERENCE;
      const gapLength = CIRCUMFERENCE - strokeLength;
      const offset = accumulatedOffset;
      accumulatedOffset += strokeLength;

      return {
        ...tag,
        strokeLength,
        gapLength,
        offset,
      };
    });
  }, [stats.sorted, stats.totalTagOccurrences, CIRCUMFERENCE]);

  const activeTagData = useMemo(() => {
    if (!selectedTag) return null;
    return stats.sorted.find((t) => t.name === selectedTag) || null;
  }, [selectedTag, stats.sorted]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 text-slate-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <PieChart className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Year Visuals ({selectedYear})</h2>
            <p className="text-xs text-slate-400">360° Tag Share & Activity Analytics</p>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards (Excludes Future Dates) */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Logged Days</span>
          <span className="text-lg sm:text-xl font-extrabold text-emerald-400 mt-0.5 block">
            {stats.loggedDaysCount}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {stats.activeRate}% {yr === currentYear ? 'so far' : 'active'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Missed Days</span>
          <span className="text-lg sm:text-xl font-extrabold text-amber-400 mt-0.5 block">
            {stats.missedDaysCount}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {stats.missedRate}% {yr === currentYear ? '(past only)' : 'empty'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
          <span className="text-[11px] text-slate-400 block font-medium">Total Tagged</span>
          <span className="text-lg sm:text-xl font-extrabold text-indigo-400 mt-0.5 block">
            {stats.totalTagOccurrences}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {stats.sorted.length} unique tags
          </span>
        </div>
      </div>

      {/* 360° Round Circle Tag Distribution Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">360° Tag Share Circle</h3>
          </div>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {stats.totalTagOccurrences > 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* SVG 360° Circular Donut */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                {/* Background Ring Track */}
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  className="stroke-slate-800/80"
                  strokeWidth="22"
                  fill="transparent"
                />

                {/* Tag Slices */}
                {donutSegments.map((seg) => {
                  const isSelected = selectedTag === seg.name;
                  const isDimmed = selectedTag && !isSelected;

                  return (
                    <circle
                      key={seg.name}
                      cx="100"
                      cy="100"
                      r={RADIUS}
                      stroke={seg.color}
                      strokeWidth={isSelected ? 26 : 22}
                      strokeDasharray={`${seg.strokeLength} ${seg.gapLength}`}
                      strokeDashoffset={-seg.offset}
                      fill="transparent"
                      className={`transition-all duration-300 cursor-pointer ${
                        isDimmed ? 'opacity-30' : 'opacity-100 hover:opacity-90'
                      }`}
                      onClick={() => setSelectedTag(isSelected ? null : seg.name)}
                    />
                  );
                })}
              </svg>

              {/* Center Info Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                {activeTagData ? (
                  <>
                    <span
                      style={{ color: activeTagData.color }}
                      className="text-base sm:text-lg font-black truncate max-w-[140px]"
                    >
                      #{activeTagData.name}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {activeTagData.percentOfTags}%
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {activeTagData.count} {activeTagData.count === 1 ? 'day' : 'days'} ({Math.round(activeTagData.degrees)}°)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {stats.totalTagOccurrences}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      Total Tags
                    </span>
                    <span className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                      360° Breakdown
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Tag Chips Legend */}
            <div className="w-full pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Tap a tag to inspect slice
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 max-h-36 overflow-y-auto p-1">
                {stats.sorted.map((t) => {
                  const isSelected = selectedTag === t.name;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? null : t.name)}
                      style={{
                        borderColor: isSelected ? t.color : `${t.color}50`,
                        backgroundColor: isSelected ? `${t.color}35` : `${t.color}15`,
                        color: t.color,
                      }}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-white/50 scale-105' : 'hover:scale-102 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: t.color }}
                        className="w-2 h-2 rounded-full inline-block shrink-0"
                      />
                      <span>#{t.name}</span>
                      <span className="text-[11px] font-mono opacity-80">
                        {t.percentOfTags}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <PieChart className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">No tag logs yet in {selectedYear}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Entries you create will automatically build this 360° circle.
            </p>
          </div>
        )}
      </div>

      {/* Tag Frequency Distribution Sorted List (No Log Button) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <TagIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Tag Frequency Distribution</h3>
          </div>
          <span className="text-[11px] text-slate-400">Sorted by frequency</span>
        </div>

        {stats.sorted.length > 0 ? (
          <div className="space-y-3 pt-1">
            {stats.sorted.map((tag) => {
              const barWidth = Math.max(6, Math.round((tag.count / stats.maxCount) * 100));
              const isSelected = selectedTag === tag.name;

              return (
                <div
                  key={tag.name}
                  onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected ? 'bg-slate-800/80 ring-1 ring-indigo-500/50' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span
                      style={{
                        backgroundColor: `${tag.color}25`,
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                      className="px-2.5 py-0.5 rounded-full border text-xs font-bold"
                    >
                      #{tag.name}
                    </span>

                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-300 font-bold">
                        {tag.count} {tag.count === 1 ? 'day' : 'days'}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ({tag.percentOfTags}% of tags · {Math.round(tag.degrees)}°)
                      </span>
                    </div>
                  </div>

                  {/* Rounded Progress Bar */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                    <div
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: tag.color,
                      }}
                      className="h-full rounded-full transition-all duration-500 shadow-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p className="text-xs">No tag entries found for {selectedYear}.</p>
          </div>
        )}
      </div>
    </div>
  );
};
