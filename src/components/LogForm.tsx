import React, { useState, useEffect } from 'react';
import { Save, FileText, CheckCircle2, Edit3 } from 'lucide-react';
import type { Tag } from '../types';

interface LogFormProps {
  selectedDate: string;
  description: string;
  selectedTags: string[];
  availableTags: Tag[];
  onChangeDescription: (desc: string) => void;
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

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (hasExistingData && !isEditing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-4 space-y-4 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-sm text-white">{formatDateDisplay(selectedDate)}</h3>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">Saved Log Entry</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-medium text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Log</span>
          </button>
        </div>

        {selectedTags.length > 0 ? (
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
              Activities & Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: `${tagColorMap[tag] || '#64748B'}25`,
                    borderColor: tagColorMap[tag] || '#64748B',
                    color: tagColorMap[tag] || '#CBD5E1',
                  }}
                  className="inline-flex items-center px-3.5 py-1 rounded-full border text-xs font-bold"
                >
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No tags selected for this day.</p>
        )}

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
            Journal Notes
          </span>
          {description ? (
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl font-sans">
              {description}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">No journal description recorded.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl mb-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-100">Daily Journal / Notes</h3>
        </div>
        {hasExistingData && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs font-semibold text-slate-400 hover:text-white underline transition-colors"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* Selected Tags Display inside Edit Mode Card */}
      <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-3.5 shadow-inner">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
          <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">
            Selected Activities & Tags
          </span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
            {selectedTags.length} tag{selectedTags.length === 1 ? '' : 's'} selected
          </span>
        </div>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: `${tagColorMap[tag] || '#64748B'}30`,
                  borderColor: tagColorMap[tag] || '#64748B',
                  color: tagColorMap[tag] || '#CBD5E1',
                }}
                className="inline-flex items-center px-3.5 py-1.5 rounded-full border text-xs font-bold"
              >
                <span>{tag}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No tags selected yet (pick tags above)</p>
        )}
      </div>

      <textarea
        rows={5}
        value={description}
        onChange={(e) => onChangeDescription(e.target.value)}
        placeholder="What did you achieve or experience today? Write your notes here..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed font-sans shadow-inner"
      />

      <div className="flex items-center justify-between mt-3 pt-2 gap-2">
        <span className="text-xs text-slate-500 font-medium">{description.length} chars</span>

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{hasExistingData ? 'Update Log' : "Save Log"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
