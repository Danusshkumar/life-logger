import React, { useState, useEffect } from 'react';
import { Edit3, X, FileText, Tag as TagIcon } from 'lucide-react';
import type { Tag } from '../types';

interface LogFormProps {
  selectedDate: string;
  description: string;
  selectedTags: string[];
  availableTags: Tag[];
  onChangeDescription: (desc: string) => void;
  onToggleTag: (tagName: string) => void;
  onOpenTagModal?: () => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasExistingData: boolean;
}

export const LogForm: React.FC<LogFormProps> = ({
  selectedDate,
  description,
  selectedTags,
  availableTags,
  onChangeDescription,
  onToggleTag,
  onOpenTagModal,
  onSave,
  isSaving,
  hasExistingData,
}) => {
  const [isEditing, setIsEditing] = useState(!hasExistingData);

  useEffect(() => {
    setIsEditing(!hasExistingData);
  }, [selectedDate, hasExistingData]);

  const tagColorMap = availableTags.reduce((acc, tag) => {
    acc[tag.name] = tag.color;
    return acc;
  }, {} as Record<string, string>);

  const handleSaveClick = async () => {
    await onSave();
    setIsEditing(false);
  };

  if (hasExistingData && !isEditing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-4 space-y-3.5 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Journal Log</h3>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            title="Edit Log"
            className="w-8 h-8 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: `${tagColorMap[tag] || '#64748B'}25`,
                  borderColor: tagColorMap[tag] || '#64748B',
                  color: tagColorMap[tag] || '#CBD5E1',
                }}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold"
              >
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}

        {description && (
          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed whitespace-pre-wrap bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl font-sans font-medium">
            {description}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-100">Daily Journal / Notes</h3>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenTagModal && (
            <button
              onClick={onOpenTagModal}
              title="Select Activities & Tags"
              className="relative w-8 h-8 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <TagIcon className="w-4 h-4 text-indigo-400" />
              {selectedTags.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border border-slate-900">
                  {selectedTags.length}
                </span>
              )}
            </button>
          )}

          {hasExistingData && (
            <button
              onClick={() => setIsEditing(false)}
              title="Cancel Editing"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Selected Tags Pills directly above input */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              title="Click to deselect"
              style={{
                backgroundColor: `${tagColorMap[tag] || '#64748B'}30`,
                borderColor: tagColorMap[tag] || '#64748B',
                color: tagColorMap[tag] || '#CBD5E1',
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold cursor-pointer active:scale-95 transition-all shadow-sm ring-1 ring-indigo-500/30"
            >
              <span>{tag}</span>
              <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      <textarea
        rows={5}
        value={description}
        onChange={(e) => onChangeDescription(e.target.value)}
        placeholder="What did you achieve or experience today? Write your notes here..."
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed font-sans shadow-inner"
      />

      <div className="flex items-center justify-end mt-4 pt-1">
        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center shrink-0"
        >
          {isSaving ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{hasExistingData ? 'Updating' : 'Saving'}</span>
            </div>
          ) : (
            <span>{hasExistingData ? 'Update' : 'Save'}</span>
          )}
        </button>
      </div>
    </div>
  );
};
