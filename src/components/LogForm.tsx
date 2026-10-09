import React from 'react';
import { Save, FileText, CheckCircle2 } from 'lucide-react';

interface LogFormProps {
  description: string;
  onChangeDescription: (desc: string) => void;
  onSave: () => void;
  isSaving: boolean;
  hasExistingData: boolean;
}

export const LogForm: React.FC<LogFormProps> = ({
  description,
  onChangeDescription,
  onSave,
  isSaving,
  hasExistingData,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-sm text-slate-200">Daily Journal / Notes</h3>
        </div>
        {hasExistingData && (
          <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>Saved Entry</span>
          </span>
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
        <span className="text-[10px] text-slate-500 font-mono">
          {description.length} characters
        </span>

        <button
          onClick={onSave}
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
              <span>{hasExistingData ? 'Update Log' : 'Save Today\'s Log'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
