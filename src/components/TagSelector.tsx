import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Search, Check } from 'lucide-react';
import type { Tag } from '../types';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onAddCustomTag?: (tagName: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onToggleTag,
  onAddCustomTag,
}) => {
  const [search, setSearch] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCustom = () => {
    if (!customTagInput.trim()) return;
    const formatted = customTagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (onAddCustomTag) {
      onAddCustomTag(formatted);
    }
    onToggleTag(formatted);
    setCustomTagInput('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TagIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Activities / Tags</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {selectedTags.length} selected
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tag</span>
        </button>
      </div>

      {/* Filter search bar if tags > 6 */}
      {availableTags.length > 6 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      )}

      {/* Tag Badges Grid */}
      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() => onToggleTag(tag.name)}
              style={{
                borderColor: tag.color,
                backgroundColor: isSelected ? `${tag.color}25` : '#0f172a',
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isSelected
                  ? 'text-white shadow-md shadow-slate-900 ring-2 ring-indigo-500/30'
                  : 'text-slate-300 hover:border-indigo-400/50 hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>#{tag.name}</span>
              {isSelected && <Check className="w-3 h-3 text-indigo-400 ml-0.5" />}
            </button>
          );
        })}

        {filteredTags.length === 0 && (
          <p className="text-xs text-slate-500 py-2 italic">No tags matching "{search}"</p>
        )}
      </div>

      {/* Inline Add Tag Modal */}
      {showAddModal && (
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center space-x-2 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="e.g. gym, deep-work"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleAddCustom}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-all"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddModal(false)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
