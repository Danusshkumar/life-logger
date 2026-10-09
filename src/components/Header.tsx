import React, { useState } from 'react';
import { LogIn, LogOut, Settings, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { AppConfig } from '../types';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
  config,
  onSaveConfig,
  onRefresh,
  isSyncing,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState<AppConfig>(config);

  const handleSave = () => {
    onSaveConfig(tempConfig);
    setShowSettings(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-lg">
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

        <div className="flex items-center space-x-2">
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
            onClick={() => setShowSettings(true)}
            title="App Settings"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-indigo-600/30 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-white">App Configurations</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Google OAuth Client ID</label>
                <input
                  type="text"
                  value={tempConfig.clientId}
                  onChange={(e) => setTempConfig({ ...tempConfig, clientId: e.target.value })}
                  placeholder="e.g. 123456...apps.googleusercontent.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Obtained from Google Cloud Console (Authorized Origins: your PWA URL). Public & client-side safe.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Google Spreadsheet ID</label>
                <input
                  type="text"
                  value={tempConfig.spreadsheetId}
                  onChange={(e) => setTempConfig({ ...tempConfig, spreadsheetId: e.target.value })}
                  placeholder="e.g. 1BxiMVs0XRnt3kg_eG5... (from URL)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Found in your sheet URL: docs.google.com/spreadsheets/d/<b>SPREADSHEET_ID</b>/edit
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Active Year Sheet Name</label>
                <input
                  type="text"
                  value={tempConfig.sheetYear}
                  onChange={(e) => setTempConfig({ ...tempConfig, sheetYear: e.target.value })}
                  placeholder="LifeLogger_2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tag Master Sheet Name</label>
                <input
                  type="text"
                  value={tempConfig.tagMasterSheet}
                  onChange={(e) => setTempConfig({ ...tempConfig, tagMasterSheet: e.target.value })}
                  placeholder="Tag Master"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center space-x-1 shadow-md shadow-indigo-600/30 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
