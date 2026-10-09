import React, { useState } from 'react';
import { LogIn, LogOut, Settings, Calendar, RefreshCw, CheckCircle2, BookOpen, History } from 'lucide-react';
import type { AppConfig } from '../types';
import { extractSpreadsheetId } from '../utils/urlParser';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onRefresh: () => void;
  isSyncing: boolean;
  activeTab: 'log' | 'history' | 'docs';
  onSelectTab: (tab: 'log' | 'history' | 'docs') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
  config,
  onSaveConfig,
  onRefresh,
  isSyncing,
  activeTab,
  onSelectTab,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [rawUrlInput, setRawUrlInput] = useState<string>(config.spreadsheetId);

  const handleSave = () => {
    const extractedId = extractSpreadsheetId(rawUrlInput);
    onSaveConfig({
      ...config,
      spreadsheetId: extractedId,
    });
    setShowSettings(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Life Logger
              </h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">Google Sheets Synced PWA</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Quick Tab Switcher */}
            <button
              onClick={() => onSelectTab('log')}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'log'
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Daily Log"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('history')}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Timeline Feed"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('docs')}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'docs'
                  ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="App Guide & Conventions"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {isAuthenticated && (
              <button
                onClick={onRefresh}
                disabled={isSyncing}
                title="Refresh sheet data"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}

            <button
              onClick={() => {
                setRawUrlInput(config.spreadsheetId);
                setShowSettings(true);
              }}
              title="App Settings"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-md shadow-indigo-600/30 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal - Top-level Stacking Context (z-50) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl text-slate-200 my-auto max-h-[85vh] flex flex-col relative z-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="font-semibold text-base text-white">App Configurations</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 my-3 text-xs overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Google Spreadsheet URL or ID</label>
                <textarea
                  rows={2}
                  value={rawUrlInput}
                  onChange={(e) => setRawUrlInput(e.target.value)}
                  placeholder="Paste full URL: https://docs.google.com/spreadsheets/d/1BxiMVs0.../edit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px] resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Paste your full Google Sheet URL or ID. The app automatically extracts the cryptographic ID!
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[10px] text-slate-400">
                <div className="flex justify-between">
                  <span>Google Client ID:</span>
                  <span className="font-mono text-indigo-400">Pre-configured (Hardcoded)</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Year Sheet:</span>
                  <span className="font-mono text-slate-300">LifeLogger_2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Tag Master Sheet:</span>
                  <span className="font-mono text-slate-300">Tag Master</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center space-x-1 shadow-md shadow-indigo-600/30 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
