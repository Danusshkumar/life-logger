import React, { useState } from 'react';
import { BookOpen, CheckCircle, Table, Tag, ExternalLink, ShieldAlert, Settings, CheckCircle2 } from 'lucide-react';
import type { AppConfig } from '../types';
import { extractSpreadsheetId } from '../utils/urlParser';

interface DocsViewProps {
  config?: AppConfig;
  geminiApiKey?: string;
  onSaveConfig?: (newConfig: AppConfig, apiKey?: string) => void;
}

export const DocsView: React.FC<DocsViewProps> = ({ config, geminiApiKey = '', onSaveConfig }) => {
  const [urlInput, setUrlInput] = useState<string>(config?.spreadsheetId || '');
  const [keyInput, setKeyInput] = useState<string>(geminiApiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!config || !onSaveConfig) return;
    const extractedId = extractSpreadsheetId(urlInput);
    onSaveConfig(
      {
        ...config,
        spreadsheetId: extractedId,
      },
      keyInput.trim()
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 text-slate-200 text-xs">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">App Guide & Settings</h2>
            <p className="text-xs text-slate-400 font-medium">Configure your Google Sheet & Gemini AI API Key</p>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed text-xs mt-2.5 pt-2.5 border-t border-slate-800">
          Life Logger syncs directly with your personal Google Sheet and uses Google AI Studio for voice journaling.
        </p>
      </div>

      {/* Interactive Settings Card */}
      {config && onSaveConfig && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-4">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs resize-none shadow-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Paste your full Google Sheet URL from your browser address bar. The app automatically extracts the ID!
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold text-xs mb-1.5">
              Gemini AI API Key <span className="text-slate-400 font-medium">(Free BYOK Setup)</span>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste AI Studio key (AIzaSy...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs shadow-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Get your free key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium">aistudio.google.com</a> (500 free voice logs/day).
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-[11px] text-slate-400 font-medium shrink-0">
              Client ID: <code className="text-indigo-300">6951012... (Pre-configured)</code>
            </span>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 text-white font-semibold text-xs rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedSuccess ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide: How to Get Free Gemini API Key */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">How to Get Your FREE Gemini AI Key (1-Minute Setup)</h3>
        </div>

        <div className="space-y-3 text-slate-300 text-xs">
          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
            <p className="leading-relaxed">
              Open <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium">aistudio.google.com</a> and sign in with your Google account.
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
            <p className="leading-relaxed">
              Acknowledge to continue on the <strong className="text-white">"Welcome to Google AI Studio"</strong> prompt if shown.
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
            <p className="leading-relaxed">
              Click <strong className="text-white">Get API key</strong> in the left sidebar menu.
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
            <p className="leading-relaxed">
              Click <strong className="text-white">Create API key</strong>.
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">5</span>
            <p className="leading-relaxed">
              Select an existing Google Cloud project if you have one, or click <strong className="text-white">Create API key in new project</strong> (Google will create the container automatically in 1 click).
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">6</span>
            <p className="leading-relaxed">
              Copy your generated API key (starts with <code className="text-indigo-300 font-semibold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">AIzaSy...</code>).
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <span className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">7</span>
            <p className="leading-relaxed">
              Paste the key into the <strong className="text-white">Gemini AI API Key</strong> input box above and tap <strong className="text-white">Save Configuration</strong>.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
          <p className="text-slate-200 font-semibold">Free Tier Quota Limits per User:</p>
          <p className="text-slate-300">• 500 voice logs per day (RPD)</p>
          <p className="text-slate-300">• 15 requests per minute (RPM)</p>
          <p className="text-slate-300">• 100% Free (No credit card or billing required)</p>
        </div>
      </div>

      {/* 1. Spreadsheet URL & ID Extraction Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">1. Automatic URL Sanitizer</h3>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          You can paste your entire Google Sheet URL. The app automatically strips <code className="text-indigo-300 font-semibold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">/edit#gid=0</code>, query parameters, and extracts the 44-character cryptographic ID:
        </p>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-medium text-[11px] text-slate-300 break-all">
          https://docs.google.com/spreadsheets/d/<span className="text-indigo-300 font-semibold">1BxiMVs0XRnt3kg_eG5x0y1abc12345</span>/edit#gid=0
        </div>
      </div>

      {/* 2. Sheet Naming Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Table className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">2. Tab Naming Convention</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-2.5">
            <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">LifeLogger_YYYY</span> (e.g., <code className="text-indigo-300 font-semibold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">LifeLogger_2026</code>)
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Active sheet for the current year. If missing, the app automatically creates it with all dates pre-filled from Jan 1 to Dec 31!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white">TagsMaster</span>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                Holds your tag badges, color hex codes, and descriptions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Column Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Tag className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">3. Required Column Structure (Row 1)</h3>
        </div>

        <p className="text-slate-300 text-xs leading-relaxed">
          Row 1 in <code className="text-indigo-300 font-semibold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">LifeLogger_YYYY</code> MUST have the exact following headers:
        </p>

        <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <span className="text-indigo-400 font-bold block text-xs">Col A</span>
            <span className="text-white font-semibold">Date</span>
            <span className="text-slate-400 text-[10px] block font-medium">YYYY-MM-DD</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <span className="text-indigo-400 font-bold block text-xs">Col B</span>
            <span className="text-white font-semibold">Activities</span>
            <span className="text-slate-400 text-[10px] block font-medium">gym, reading</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
            <span className="text-indigo-400 font-bold block text-xs">Col C</span>
            <span className="text-white font-semibold">Description</span>
            <span className="text-slate-400 text-[10px] block font-medium">Journal notes</span>
          </div>
        </div>
      </div>

      {/* 4. Strict Validation & Fail-Fast */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-md space-y-3">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">4. Strict Fail-Fast Validation</h3>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          If your sheet exists but Row 1 headers do not match <code className="text-indigo-300 font-semibold px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded">Date | Activities | Description</code>, the app halts sync and displays an error modal to prevent corrupting your sheet data.
        </p>
      </div>
    </div>
  );
};
