import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Search, Check, AlertCircle, X } from 'lucide-react';
import type { Tag, LogEntry } from '../types';
import { generateRandomHexColor, isValidTagName } from '../services/googleSheets';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  recentLogs?: LogEntry[];
  onToggleTag: (tagName: string) => void;
  onAddCustomTag?: (newTag: Tag) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  recentLogs,
  onToggleTag,
  onAddCustomTag,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [validationError, setValidationError] = useState('');

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

  const handleAddTag = () => {
    const formatted = newTagName.trim().toLowerCase();
    if (!formatted) {
      setValidationError('Tag name cannot be empty.');
      return;
    }

    if (!isValidTagName(formatted)) {
      setValidationError('Tag name must be a single word using lowercase letters (a-z) and hyphens (-) only.');
      return;
    }

    if (availableTags.some((t) => t.name === formatted)) {
      setValidationError('A tag with this name already exists in TagsMaster.');
      return;
    }

    const randomColor = generateRandomHexColor();
    const createdTag: Tag = {
      name: formatted,
      color: randomColor,
      description: newTagDesc.trim(),
    };

    if (onAddCustomTag) {
      onAddCustomTag(createdTag);
    }

    onToggleTag(formatted);
    setNewTagName('');
    setNewTagDesc('');
    setValidationError('');
    setShowAddModal(false);
  };

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

        {/* Icon-only New Tag Button */}
        <button
          onClick={() => {
            setValidationError('');
            setShowAddModal(true);
          }}
          title="Add New Tag"
          className="w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
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
              {isSelected && (
                <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" style={{ color: tag.color }} />
              )}
            </button>
          );
        })}

        {sortedTags.length === 0 && (
          <p className="text-xs text-slate-400 py-3 italic">
            {availableTags.length === 0 ? 'No tags found in TagsMaster sheet.' : `No tags matching "${search}"`}
          </p>
        )}
      </div>

      {/* Add Custom Tag Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-200 space-y-3 my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-semibold text-sm text-white flex items-center space-x-1.5">
                <TagIcon className="w-4 h-4 text-indigo-400" />
                <span>Add Tag to TagsMaster</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] p-2.5 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Tag Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. gym, outing"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  setValidationError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <p className="text-[10px] text-slate-500 mt-1">Single word, lowercase letters (a-z) and hyphens (-) only.</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Tag Description</label>
              <textarea
                rows={2}
                placeholder="What does this tag represent?"
                value={newTagDesc}
                onChange={(e) => setNewTagDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
