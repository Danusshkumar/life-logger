import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Search, Check, AlertCircle } from 'lucide-react';
import type { Tag } from '../types';
import { generateRandomHexColor, isValidTagName } from '../services/googleSheets';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagName: string) => void;
  onAddCustomTag?: (newTag: Tag) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  availableTags,
  selectedTags,
  onToggleTag,
  onAddCustomTag,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagDesc, setNewTagDesc] = useState('');
  const [validationError, setValidationError] = useState('');
  const [hoveredTag, setHoveredTag] = useState<Tag | null>(null);

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md mb-4">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center space-x-2 shrink-0">
          <TagIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          <h3 className="font-semibold text-xs text-slate-200 whitespace-nowrap">Activities / Tags</h3>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {selectedTags.length} selected
          </span>
        </div>

        <button
          onClick={() => {
            setValidationError('');
            setShowAddModal(true);
          }}
          className="flex items-center space-x-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-lg transition-all shrink-0 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Tag</span>
        </button>
      </div>

      {/* Search Filter Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search tags or descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
        />
      </div>

      {/* Tag Badges Grid */}
      <div className="flex flex-wrap gap-2.5 max-h-56 overflow-y-auto pr-1">
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <div key={tag.name} className="relative group">
              <button
                onClick={() => onToggleTag(tag.name)}
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
                style={{
                  borderColor: tag.color,
                  backgroundColor: isSelected ? `${tag.color}35` : '#0b0f19',
                }}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-lg ring-2 ring-indigo-500/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                <span>#{tag.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-300 ml-0.5 shrink-0" />}
              </button>

              {/* Tag Description Tooltip on Hover */}
              {hoveredTag?.name === tag.name && tag.description && (
                <div className="absolute bottom-full left-0 mb-1 z-30 bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl shadow-2xl w-52 pointer-events-none animate-in fade-in duration-100">
                  <p className="font-bold text-white">#{tag.name}</p>
                  <p className="text-slate-400 mt-0.5 leading-snug">{tag.description}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredTags.length === 0 && (
          <p className="text-xs text-slate-400 py-3 italic">
            {availableTags.length === 0 ? 'No tags found in TagsMaster sheet.' : `No tags matching "${search}"`}
          </p>
        )}
      </div>

      {/* Add Custom Tag Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-200 space-y-3 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-semibold text-sm text-white flex items-center space-x-1.5">
                <TagIcon className="w-4 h-4 text-indigo-400" />
                <span>Add Tag to TagsMaster</span>
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
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
                placeholder="e.g. leetcode, cloud-learn"
                value={newTagName}
                onChange={(e) => {
                  setNewTagName(e.target.value);
                  setValidationError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTag}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md transition-all"
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
