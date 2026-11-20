import React, { useState } from 'react';
import { Tag as TagIcon, Search, X } from 'lucide-react';
import type { Tag, LogEntry } from '../types';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  recentLogs?: LogEntry[];
  onToggleTag: (tagName: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  recentLogs,
  onToggleTag,
}) => {
  const [search, setSearch] = useState('');

  // Map each tag to its most recent log date
  const lastUsedMap: Record<string, string> = {};
  if (recentLogs) {
    recentLogs.forEach((log) => {
      if (log.activities && Array.isArray(log.activities)) {
        log.activities.forEach((tagName) => {
          if (!lastUsedMap[tagName] || log.date > lastUsedMap[tagName]) {
            lastUsedMap[tagName] = log.date;
          }
        });
      }
    });
  }

  const filteredTags = availableTags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Sort tags by recency of use (most recent first)
  const sortedTags = [...filteredTags].sort((a, b) => {
    const dateA = lastUsedMap[a.name] || '';
    const dateB = lastUsedMap[b.name] || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-4">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <TagIcon className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 whitespace-nowrap">Activities & Tags</h3>
            <span className="text-[11px] font-semibold text-indigo-400">
              {selectedTags.length} selected
            </span>
          </div>
        </div>
      </div>

      {/* Search Filter Input with Clear X Button */}
      <div className="relative mb-4 flex items-center">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search tags or descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag Badges Grid Sorted by Recency */}
      <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto pr-1">
        {sortedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => onToggleTag(tag.name)}
              style={{
                borderColor: tag.color,
                backgroundColor: isSelected ? `${tag.color}35` : '#0b0f19',
                color: tag.color,
              }}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full border text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? 'shadow-lg ring-2 ring-indigo-500/40 opacity-100'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              <span>{tag.name}</span>
            </button>
          );
        })}

        {sortedTags.length === 0 && (
          <p className="text-xs text-slate-500 py-3 italic">
            {availableTags.length === 0 ? 'No tags found in TagsMaster sheet.' : `No tags matching "${search}"`}
          </p>
        )}
      </div>
    </div>
  );
};
