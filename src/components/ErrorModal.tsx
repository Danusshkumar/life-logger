import React from 'react';
import { AlertOctagon, BookOpen, RefreshCw, X } from 'lucide-react';

interface ErrorModalProps {
  title: string;
  message: string;
  details?: string;
  onClose: () => void;
  onOpenDocs?: () => void;
  onRetry?: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  title,
  message,
  details,
  onClose,
  onOpenDocs,
  onRetry,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-rose-900/60 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-200 relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/40">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">{title}</h3>
            <p className="text-[10px] text-rose-400 font-semibold tracking-wide uppercase">App Convention / Sync Error</p>
          </div>
        </div>

        <div className="my-4 space-y-2 text-xs">
          <p className="text-slate-200 leading-relaxed font-medium">{message}</p>

          {details && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-medium text-slate-400 leading-normal max-h-32 overflow-y-auto">
              {details}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          {onOpenDocs && (
            <button
              onClick={() => {
                onClose();
                onOpenDocs();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-medium text-xs rounded-xl transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View /docs Guide</span>
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
