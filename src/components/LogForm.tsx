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
              <p className="text-[10px] text-emerald-400 font-mono">Saved Log Entry</p>
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
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: `${tagColorMap[tag] || '#64748B'}25`,
                    borderColor: tagColorMap[tag] || '#64748B',
                    color: tagColorMap[tag] || '#CBD5E1',
                  }}
                  className="px-2.5 py-1 rounded-xl border text-xs font-medium"
                >
                  #{tag}
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
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Daily Journal / Notes</h3>
        </div>
        {hasExistingData && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-[11px] text-slate-400 hover:text-white underline"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* Selected Tags Display inside Edit Mode Card */}
      <div className="mb-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Selected Activities & Tags
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {selectedTags.length} tag{selectedTags.length === 1 ? '' : 's'} selected
          </span>
        </div>
        {selectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: `${tagColorMap[tag] || '#64748B'}25`,
                  borderColor: tagColorMap[tag] || '#64748B',
                  color: tagColorMap[tag] || '#CBD5E1',
                }}
                className="px-2.5 py-1 rounded-xl border text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No tags selected yet (pick tags above)</p>
        )}
      </div>

      <textarea
        rows={5}
        value={description}
        onChange={(e) => onChangeDescription(e.target.value)}
        placeholder="What did you achieve or experience today? Write your notes here..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-y leading-relaxed font-sans"
      />

      <div className="flex items-center justify-between mt-3 pt-2">
        <span className="text-[10px] text-slate-500 font-mono">{description.length} characters</span>

        <button
          onClick={handleSaveClick}
          disabled={isSaving}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving to Sheet...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{hasExistingData ? 'Update Log' : "Save Today's Log"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
