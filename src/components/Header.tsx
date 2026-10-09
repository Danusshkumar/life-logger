import React from 'react';
import { LogIn, LogOut, Calendar, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
  onRefresh,
  isSyncing,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-lg">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* App Title & Subtitle */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Life Logger
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5 font-medium">Google Sheets Synced PWA</p>
          </div>
        </div>

        {/* Top Right Action Buttons (Ultra Clean) */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Refresh sheet data"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
