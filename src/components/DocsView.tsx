import React, { useState } from 'react';
import {
  BookOpen,
  Settings,
  User,
  Mail,
  ShieldCheck,
  Table,
  BarChart3,
  Tag as TagIcon,
  ChevronRight,
  Sparkles,
  FileCode2,
} from 'lucide-react';
import type { AppConfig } from '../types';
import type { GoogleUserProfile } from '../services/googleAuth';
import { extractSpreadsheetId } from '../utils/urlParser';

interface DocsViewProps {
  config?: AppConfig;
  geminiApiKey?: string;
  selectedYear?: string;
  userProfile?: GoogleUserProfile | null;
  onOpenTagManager?: () => void;
  onOpenVisuals?: () => void;
  onOpenMapper?: () => void;
  onYearChange?: (year: string) => void;
  onSaveConfig?: (newConfig: AppConfig, apiKey?: string) => void;
}

export const DocsView: React.FC<DocsViewProps> = ({
  config,
  geminiApiKey = '',
  selectedYear = '2026',
  userProfile,
  onOpenTagManager,
  onOpenVisuals,
  onOpenMapper,
  onYearChange,
  onSaveConfig,
}) => {
  const [urlInput, setUrlInput] = useState<string>(config?.spreadsheetId || '');
  const [yearInput, setYearInput] = useState<string>(selectedYear);
  const [keyInput, setKeyInput] = useState<string>(geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [yearSavedSuccess, setYearSavedSuccess] = useState(false);

  // Sync year input if selectedYear changes from outside
  React.useEffect(() => {
    setYearInput(selectedYear);
  }, [selectedYear]);

  const handleSaveYear = () => {
    const yr = parseInt(yearInput, 10);
    if (isNaN(yr) || yr < 2004 || yr > 2104) {
      alert('Please enter a valid year between 2004 and 2104.');
      return;
    }
    if (onYearChange) {
      onYearChange(yearInput);
      setYearSavedSuccess(true);
      setTimeout(() => setYearSavedSuccess(false), 2500);
    }
  };

  const handleSave = () => {
    if (!onSaveConfig || !config) return;

    const cleanedId = extractSpreadsheetId(urlInput);
    onSaveConfig(
      {
        ...config,
        spreadsheetId: cleanedId,
      },
      keyInput.trim()
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 text-slate-200 text-xs">
      {/* 1. Connected Google Account Profile Card (Top) */}
      {userProfile && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">Connected Google Account</h3>
          </div>

          <div className="flex items-center space-x-3.5 pt-1">
            {userProfile.picture ? (
              <img
                src={userProfile.picture}
                alt={userProfile.name || 'User Profile'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border-2 border-indigo-500/40 shadow-md object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base shrink-0">
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white truncate block">
                  {userProfile.name || userProfile.given_name || 'Google User'}
                </span>
                {userProfile.email_verified && (
                  <span title="Verified Account" className="shrink-0 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                )}
              </div>
              {userProfile.email && (
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{userProfile.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Navigation Quick Links: TagsMaster Manager & Year Visuals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {onOpenTagManager && (
          <div
            onClick={onOpenTagManager}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <TagIcon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  TagsMaster Manager
                </h3>
                <p className="text-[11px] text-slate-400">View, edit names, descriptions & colors</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-300 transition-colors" />
          </div>
        )}

        {onOpenVisuals && (
          <div
            onClick={onOpenVisuals}
            className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  Year Visuals & Analytics
                </h3>
                <p className="text-[11px] text-slate-400">360° tag share circle & distribution</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-300 transition-colors" />
          </div>
        )}

        {onOpenMapper && (
          <div
            onClick={onOpenMapper}
            className="sm:col-span-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FileCode2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  Category Mapper
                </h3>
                <p className="text-[11px] text-slate-400">
                  Automate notification vendor to category dictionary
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-300 transition-colors" />
          </div>
        )}
      </div>

      {/* 3. App Hub & Settings Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">App Hub & Settings</h2>
            <p className="text-xs text-slate-400 font-medium">Google Sheet Configuration, Tag Management & Features</p>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs mt-2.5 pt-2.5 border-t border-slate-800">
          Life Logger syncs directly with your Google Sheet as an automated, private database.
        </p>
      </div>

      {/* 4. App Credentials & Configuration Card */}
      {config && onSaveConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Settings className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="font-bold text-sm text-slate-200">App Credentials & Configuration</h3>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold text-xs mb-1.5">Google Sheet URL or ID</label>
            <textarea
              rows={2}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste full Google Sheet URL here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none shadow-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Paste your full Google Sheet URL from your browser address bar. The built-in URL Sanitizer automatically extracts the ID!
            </p>
          </div>

          {onYearChange && (
            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">Target Log Year</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={2004}
                  max={2104}
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveYear();
                  }}
                  placeholder="e.g. 2026"
                  className="flex-1 h-11 bg-slate-950 border border-slate-800 text-indigo-300 font-bold text-sm rounded-xl px-3.5 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSaveYear}
                  className="h-11 px-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-semibold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  {yearSavedSuccess ? 'Saved!' : 'Save Year'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Enter any year (2004–2104) and click &quot;Save Year&quot; to switch the active sheet tab.
              </p>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold text-xs mb-1.5">
              Gemini AI API Key <span className="text-slate-400 font-medium">(Free BYOK Setup)</span>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste AI Studio key (AIzaSy...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs shadow-sm font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">
              Client ID: <code className="text-indigo-300">6951012... (Pre-configured)</code>
            </span>

            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-semibold text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>{savedSuccess ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Standalone Box: How to Get Your 100% Free Gemini API Key */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>How to Get Your 100% Free Gemini API Key</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs leading-relaxed pl-1">
          <li>
            Open <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-semibold">Google AI Studio (aistudio.google.com/app/apikey)</a>.
          </li>
          <li>Sign in with your Google account.</li>
          <li>
            Click <strong className="text-white">&quot;Create API Key&quot;</strong> and choose <em className="text-slate-200">&quot;Create key in new project&quot;</em>.
          </li>
          <li>Copy the key (starts with <code className="text-indigo-300 font-mono">AIzaSy...</code>) and paste it into the Gemini AI API Key field above.</li>
        </ol>
        <p className="text-[11px] text-emerald-400 font-medium pt-2 border-t border-slate-800">
          ✓ Free Tier includes 15 requests/min and 1,500 requests/day at zero cost with no credit card required.
        </p>
      </div>

      {/* 6. Single Consolidated Spreadsheet Conventions & Architecture Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Table className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">Google Sheet Conventions & Architecture</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Automatic URL Sanitizer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="font-bold text-white text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Automatic URL Sanitizer</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              You can paste full URLs with query parameters. The app automatically extracts the 44-character spreadsheet ID.
            </p>
          </div>

          {/* Tab Names */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">Required Sheet Tab Names:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="font-mono text-indigo-300 font-bold block">LifeLogger_YYYY</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Active year tab (e.g. <code className="text-slate-200">LifeLogger_2026</code>). Auto-created with 365/366 dates if missing.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="font-mono text-indigo-300 font-bold block">TagsMaster</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tag directory: Col A = Name, Col B = Color hex, Col C = Description.
                </p>
              </div>
            </div>
          </div>

          {/* Row 1 Headers & Strict Date Validator */}
          <div className="space-y-2">
            <span className="font-bold text-white text-xs block">Row 1 Headers & Strict Calendar Continuity:</span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <span className="text-indigo-400 font-bold block text-[11px]">Col A</span>
                <span className="text-white font-bold">Date</span>
                <span className="text-slate-500 text-[10px] block">YYYY-MM-DD</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <span className="text-indigo-400 font-bold block text-[11px]">Col B</span>
                <span className="text-white font-bold">Activities</span>
                <span className="text-slate-500 text-[10px] block">gym, reading</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <span className="text-indigo-400 font-bold block text-[11px]">Col C</span>
                <span className="text-white font-bold">Description</span>
                <span className="text-slate-500 text-[10px] block">Notes & logs</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 mt-2 space-y-1">
              <p className="text-slate-200 font-semibold">Strict Continuity Fail-Safe:</p>
              <p>
                All 365 days (or 366 in leap years) from Jan 1 to Dec 31 must be in exact chronological order without missing, duplicate, or twisted date rows. If any row is malformed, sync halts to prevent corrupting your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
