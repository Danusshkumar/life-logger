import React, { useState } from 'react';
import { Search, Calendar, Inbox, X, Tag as TagIcon, Check, RotateCcw, CalendarDays } from 'lucide-react';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState<number | null>(null);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // Map tag names to color hex
  const tagColorMap = availableTags.reduce((acc, tag) => {
    acc[tag.name] = tag.color;
    return acc;
  }, {} as Record<string, string>);

  // Toggle tag filter selection
  const handleToggleTagFilter = (tagName: string) => {
    setSelectedTagFilters((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  // Filter valid entries sorted newest first
  const validEntries = entries
    .filter(
      (e) => (e.activities && e.activities.length > 0) || (e.description && e.description.trim().length > 0)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  // Filter logic:
  // 1. Search MUST match description ONLY
  // 2. Date MUST be within [startDate, endDate]
  // 3. Tag matching is OR logic (entry has ANY of the selected tags)
  const filteredEntries = validEntries.filter((entry) => {
    const matchesSearch =
      !searchTerm ||
      (entry.description && entry.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStartDate = !startDate || entry.date >= startDate;
    const matchesEndDate = !endDate || entry.date <= endDate;
    const matchesDate = matchesStartDate && matchesEndDate;

    const matchesTags =
      selectedTagFilters.length === 0 ||
      selectedTagFilters.some((tag) => entry.activities && entry.activities.includes(tag));

    return matchesSearch && matchesDate && matchesTags;
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

  // Available tags inside modal filtered by search query
  const matchingModalTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const isDateFiltered = Boolean(startDate || endDate);
  const isTagFiltered = selectedTagFilters.length > 0;
  const hasActiveFilters = Boolean(searchTerm || isDateFiltered || isTagFiltered);

  const resetAllFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setActivePreset(null);
    setSelectedTagFilters([]);
  };

  // Preset Date Range helper
  const handleSetPresetDate = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setActivePreset(days);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setActivePreset(null);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setActivePreset(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Container 1: Non-scrolling Fixed Top Search & Filter Header */}
      <div className="shrink-0 bg-slate-950 pt-1 pb-3 mb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          {/* Search Notes Input (h-12 height, bold font, left-aligned) */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            <input
              type="text"
              placeholder="Search journal notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-10 text-sm sm:text-base font-bold text-slate-100 placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 shadow-inner transition-all truncate"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex items-center justify-center"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tag Filter Button (w-12 h-12) */}
          <button
            onClick={() => setIsTagModalOpen(true)}
            className={`relative w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm ${
              isTagFiltered
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Filter by Tags"
          >
            <TagIcon className="w-5 h-5" />
            {selectedTagFilters.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center border-2 border-slate-950 shadow-md animate-in zoom-in-50">
                {selectedTagFilters.length}
              </span>
            )}
          </button>

          {/* Date Filter Button (w-12 h-12) */}
          <button
            onClick={() => setIsDateModalOpen(true)}
            className={`relative w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm ${
              isDateFiltered
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title="Filter by Date Range"
          >
            <CalendarDays className="w-5 h-5" />
          </button>

          {/* Reset All Button (w-12 h-12, shown only when active filters exist) */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="w-12 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-900/50 flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm text-slate-400 hover:text-rose-400"
              title="Reset All Filters"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Container 2: Independently Scrollable Log History Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-12 pr-0.5">
        {filteredEntries.map((entry) => (
          <div
            key={entry.date}
            onClick={() => onSelectEntry(entry)}
            className="group bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 transition-all cursor-pointer hover:shadow-indigo-950/20 active:scale-[0.99]"
          >
            {/* Header: Date Title Only */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800/80">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <span className="font-bold text-sm sm:text-base text-white">
                {formatDateLabel(entry.date)}
              </span>
            </div>

            {/* Tag Badges: Enlarged Bold Text Pills without '#' prefix or colored dots */}
            {entry.activities && entry.activities.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {entry.activities.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      backgroundColor: `${tagColorMap[tag] || '#64748B'}25`,
                      borderColor: tagColorMap[tag] || '#64748B',
                      color: tagColorMap[tag] || '#E2E8F0',
                    }}
                    className="inline-flex items-center px-4 py-1.5 rounded-full border text-xs sm:text-sm font-bold shadow-sm tracking-wide"
                  >
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Journal Notes / Description Box */}
            {entry.description ? (
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm text-slate-100 leading-relaxed font-sans font-medium whitespace-pre-wrap shadow-inner">
                {entry.description}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-1">No journal notes recorded for this date.</p>
            )}
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 my-6 shadow-md">
            <Inbox className="w-9 h-9 text-slate-600 mx-auto mb-2.5" />
            <p className="text-sm font-bold text-slate-300">No matching logs found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              No journal entries match your search query, date range, or tag filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tag Filter Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl text-slate-200 space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                  <TagIcon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">Filter Activity Tags</h4>
              </div>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Matching Tags Input inside Modal */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="Search matching tags"
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner transition-all truncate"
              />
              {tagSearchTerm && (
                <button
                  onClick={() => setTagSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dedicated Selected Tags Section */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SELECTED TAGS
                </span>
                {selectedTagFilters.length > 0 && (
                  <button
                    onClick={() => setSelectedTagFilters([])}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-[11px] font-bold rounded-lg shadow-sm active:scale-95 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>Deselect All</span>
                  </button>
                )}
              </div>

              {selectedTagFilters.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                  {selectedTagFilters.map((tagName) => (
                    <button
                      key={tagName}
                      onClick={() => handleToggleTagFilter(tagName)}
                      style={{
                        backgroundColor: `${tagColorMap[tagName] || '#64748B'}35`,
                        borderColor: tagColorMap[tagName] || '#64748B',
                        color: '#FFFFFF',
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full border text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-sm ring-2 ring-indigo-500/40"
                      title="Click to deselect tag"
                    >
                      <span>{tagName}</span>
                      <X className="w-3.5 h-3.5 text-slate-300 hover:text-white ml-0.5 shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-1">
                  No tags selected. Showing entries across all tags.
                </p>
              )}
            </div>

            {/* Matching Available Tags Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                AVAILABLE TAGS
              </span>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {matchingModalTags.map((tag) => {
                  const isSelected = selectedTagFilters.includes(tag.name);
                  return (
                    <button
                      key={tag.name}
                      onClick={() => handleToggleTagFilter(tag.name)}
                      style={{
                        borderColor: tag.color,
                        backgroundColor: isSelected ? `${tag.color}35` : '#0b0f19',
                      }}
                      className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md ring-2 ring-indigo-500/40'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>{tag.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-0.5" />}
                    </button>
                  );
                })}

                {matchingModalTags.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-2">
                    No tags match "{tagSearchTerm}"
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Picker Modal */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-200 space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-white">Filter by Date Range</h4>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets with Dynamic Highlights */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                QUICK PRESETS
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSetPresetDate(7)}
                  className={`px-2.5 py-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                    activePreset === 7
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => handleSetPresetDate(30)}
                  className={`px-2.5 py-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                    activePreset === 30
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => handleSetPresetDate(365)}
                  className={`px-2.5 py-2 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                    activePreset === 365
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  This Year
                </button>
              </div>
            </div>

            {/* Custom Dates Input */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 font-sans shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 font-sans shadow-inner"
                />
              </div>
            </div>

            {/* Modal Footer with Two Prominent Buttons */}
            <div className="flex items-center justify-between space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setActivePreset(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Clear Dates
              </button>

              <button
                onClick={() => setIsDateModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Apply Date Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
