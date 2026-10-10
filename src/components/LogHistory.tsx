import React, { useState } from 'react';
import { Search, Calendar, Edit2, Filter, Inbox } from 'lucide-react';
import type { LogEntry, Tag } from '../types';

interface LogHistoryProps {
  entries: LogEntry[];
  availableTags: Tag[];
  onSelectEntry: (entry: LogEntry) => void;
}

export const LogHistory: React.FC<LogHistoryProps> = ({
  entries,
  availableTags,
  onSelectEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Map tag names to color
  const tagColorMap = availableTags.reduce((acc, tag) => {
    acc[tag.name] = tag.color;
    return acc;
  }, {} as Record<string, string>);

  // Filter entries that have activities or description, sorted reverse chronologically (newest first)
  const validEntries = entries
    .filter(
      (e) => (e.activities && e.activities.length > 0) || (e.description && e.description.trim().length > 0)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredEntries = validEntries.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.date.includes(searchTerm);

    const matchesTag =
      !selectedTagFilter || entry.activities.includes(selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Search & Tag Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes or dates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Badges Horizontal Scroll */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              selectedTagFilter === null
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>All Logs</span>
          </button>

          {availableTags.map((tag) => {
            const isSelected = selectedTagFilter === tag.name;
            return (
              <button
                key={tag.name}
                onClick={() =>
                  setSelectedTagFilter(isSelected ? null : tag.name)
                }
                style={{
                  borderColor: tag.color,
                  backgroundColor: isSelected ? `${tag.color}30` : '#0f172a',
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry Cards List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
          <div
            key={entry.date}
            onClick={() => onSelectEntry(entry)}
            className="group bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2.5">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold text-xs text-white">
                  {formatDateLabel(entry.date)}
                </span>
              </div>
              <button
                className="text-slate-500 group-hover:text-indigo-400 text-xs flex items-center space-x-1 transition-colors"
                title="Edit Entry"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            {/* Tag Badges */}
            {entry.activities && entry.activities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {entry.activities.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: `${tagColorMap[tag] || '#64748B'}20`,
                      borderColor: tagColorMap[tag] || '#64748B',
                      color: tagColorMap[tag] || '#CBD5E1',
                    }}
                    className="px-2 py-0.5 rounded-lg border text-[10px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description Snippet */}
            {entry.description ? (
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-4">
                {entry.description}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No notes recorded for this date.</p>
            )}
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 my-6">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">No logs found</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Try changing search filters or selecting another date above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
