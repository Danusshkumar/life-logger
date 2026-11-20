import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Search, X, AlertCircle, Dices, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import type { Tag, LogEntry } from '../types';
import { generateRandomHexColor, isValidTagName } from '../services/googleSheets';

interface TagsViewProps {
  availableTags: Tag[];
  logs: LogEntry[];
  onAddCustomTag?: (newTag: Tag) => void;
  onUpdateTag?: (oldName: string, updatedTag: Tag) => void;
  onDeleteTag?: (tagName: string) => void;
  onBack?: () => void;
}

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#14B8A6', // Teal
  '#38BDF8', // Sky
  '#A855F7', // Purple
  '#64748B', // Slate
];

export const TagsView: React.FC<TagsViewProps> = ({
  availableTags,
  logs,
  onAddCustomTag,
  onUpdateTag,
  onDeleteTag,
  onBack,
}) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form State
  const [tagName, setTagName] = useState('');
  const [tagDesc, setTagDesc] = useState('');
  const [tagColor, setTagColor] = useState('#6366F1');
  const [validationError, setValidationError] = useState('');

  // Calculate annual frequency count for each tag
  const tagFrequencyMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((entry) => {
      (entry.activities || []).forEach((t) => {
        map[t] = (map[t] || 0) + 1;
      });
    });
    return map;
  }, [logs]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingTag(null);
    setTagName('');
    setTagDesc('');
    setTagColor(generateRandomHexColor());
    setValidationError('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagDesc(tag.description || '');
    setTagColor(tag.color || '#6366F1');
    setValidationError('');
    setShowModal(true);
  };

  const handleSaveTag = () => {
    const trimmedName = tagName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmedName) {
      setValidationError('Tag name is required.');
      return;
    }
    if (!isValidTagName(trimmedName)) {
      setValidationError('Use lowercase letters (a-z) and hyphens only.');
      return;
    }

    if (!editingTag) {
      // Creating new
      if (availableTags.some((t) => t.name.toLowerCase() === trimmedName)) {
        setValidationError(`Tag '#${trimmedName}' already exists.`);
        return;
      }
      onAddCustomTag?.({
        name: trimmedName,
        color: tagColor,
        description: tagDesc.trim(),
      });
    } else {
      // Updating existing
      if (
        trimmedName !== editingTag.name.toLowerCase() &&
        availableTags.some((t) => t.name.toLowerCase() === trimmedName)
      ) {
        setValidationError(`Another tag '#${trimmedName}' already exists.`);
        return;
      }
      onUpdateTag?.(editingTag.name, {
        name: trimmedName,
        color: tagColor,
        description: tagDesc.trim(),
      });
    }

    setShowModal(false);
  };

  const handleDelete = (tag: Tag) => {
    if (window.confirm(`Are you sure you want to delete the tag '#${tag.name}' from TagsMaster?`)) {
      onDeleteTag?.(tag.name);
    }
  };

  const filteredTags = availableTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 text-slate-200">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md flex items-center space-x-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <TagIcon className="w-4.5 h-4.5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">TagsMaster Manager</h2>
          <p className="text-xs text-slate-400">View, edit, and create custom tag badges</p>
        </div>
      </div>

      {/* Search Input & New Tag Action Bar */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tags by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-1.5 px-4 h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Tag</span>
        </button>
      </div>

      {/* Tag Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredTags.map((tag) => {
          const count = tagFrequencyMap[tag.name] || 0;
          return (
            <div
              key={tag.name}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    backgroundColor: `${tag.color}25`,
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                  className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold"
                >
                  #{tag.name}
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditModal(tag)}
                    title="Edit tag"
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag)}
                    title="Delete tag"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed min-h-[32px]">
                {tag.description || <span className="text-slate-500 italic">No description provided.</span>}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>
                  Logged <strong className="text-slate-200">{count}</strong> {count === 1 ? 'time' : 'times'} this year
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {tag.color}
                </span>
              </div>
            </div>
          );
        })}

        {filteredTags.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
            <TagIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">No tags found</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {search ? `No tags matching "${search}"` : 'Your TagsMaster sheet has no tags yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Tag Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl text-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center space-x-2">
                <TagIcon className="w-4 h-4 text-indigo-400" />
                <span>{editingTag ? 'Edit Tag' : 'New Tag for TagsMaster'}</span>
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tag Name</label>
              <input
                type="text"
                placeholder="e.g. gym, reading, leetcode"
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  setValidationError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
              />
              <p className="text-[10px] text-slate-500 mt-1">Single word, lowercase letters and hyphens only.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tag Description</label>
              <textarea
                rows={2}
                placeholder="What does this activity represent?"
                value={tagDesc}
                onChange={(e) => setTagDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Color Swatches */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Tag Accent Color</label>
                <button
                  type="button"
                  onClick={() => setTagColor(generateRandomHexColor())}
                  className="flex items-center space-x-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Random</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTagColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-lg transition-transform cursor-pointer ${
                      tagColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={tagColor}
                  onChange={(e) => setTagColor(e.target.value)}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTag}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {editingTag ? 'Save Changes' : 'Create Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
