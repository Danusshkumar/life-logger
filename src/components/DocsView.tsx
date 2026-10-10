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
    <div className="space-y-5 pb-20 animate-in fade-in duration-200 text-slate-200 text-xs">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">App Guide & Settings</h2>
            <p className="text-[11px] text-slate-400">Configure your Google Sheet & Gemini AI API Key</p>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px] mt-2">
          Life Logger syncs directly with your personal Google Sheet and uses Google AI Studio for voice journaling.
        </p>
      </div>

      {/* Interactive Settings Card */}
      {config && onSaveConfig && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
            <Settings className="w-4 h-4" />
            <span>App Credentials & Configuration</span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Google Sheet URL or ID</label>
            <textarea
              rows={2}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste full Google Sheet URL here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px] resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Paste your full Google Sheet URL from your browser address bar. The app automatically extracts the ID!
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Gemini AI API Key <span className="text-amber-400 font-normal">(Free BYOK Setup)</span>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste AI Studio key (AIzaSy...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Get your free key from <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono">aistudio.google.com</a> (500 free voice logs/day).
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] text-slate-400 font-mono">
              Client ID: <code className="text-indigo-400">6951012... (Pre-configured)</code>
            </span>

            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide: How to Get Free Gemini API Key */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
          <ExternalLink className="w-4 h-4" />
          <span>How to Get Your FREE Gemini AI Key (1-Minute Setup)</span>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
          <li>
            Open <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-mono font-medium">aistudio.google.com</a> and sign in with your Google account.
          </li>
          <li>
            Acknowledge to continue on the <strong className="text-white">"Welcome to Google AI Studio"</strong> prompt if shown.
          </li>
          <li>
            Click <strong className="text-white">Get API key</strong> in the left sidebar menu.
          </li>
          <li>
            Click <strong className="text-white">Create API key</strong>.
          </li>
          <li>
            Select an existing Google Cloud project if you have one, or click <strong className="text-emerald-400 font-mono">Create API key in new project</strong> (Google will create the project container for you automatically in 1 click).
          </li>
          <li>
            Copy your generated API key (starts with <code className="text-amber-300 font-mono">AIzaSy...</code>).
          </li>
          <li>
            Paste the key into the <strong className="text-white">Gemini AI API Key</strong> input box above and tap <strong className="text-white">Save Configuration</strong>.
          </li>
        </ol>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[10px] text-slate-400 space-y-1 font-mono">
          <p className="text-emerald-400 font-bold">✨ Free Tier Quota Limits per User:</p>
          <p>• 500 voice logs per day (RPD)</p>
          <p>• 15 requests per minute (RPM)</p>
          <p>• 100% Free (No credit card or billing setup required)</p>
        </div>
      </div>

      {/* 1. Spreadsheet URL & ID Extraction Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
          <ExternalLink className="w-4 h-4" />
          <span>1. Automatic URL Sanitizer</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          You can paste your entire Google Sheet URL. The app automatically strips <code className="text-amber-400">/edit#gid=0</code>, query parameters, and extracts the 44-character cryptographic ID:
        </p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-400 break-all">
          https://docs.google.com/spreadsheets/d/<span className="text-amber-400 font-bold">1BxiMVs0XRnt3kg_eG5x0y1abc12345</span>/edit#gid=0
        </div>
      </div>

      {/* 2. Sheet Naming Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
          <Table className="w-4 h-4" />
          <span>2. Tab Naming Convention</span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white font-mono">LifeLogger_YYYY</span> (e.g., <code className="text-emerald-400 font-mono">LifeLogger_2026</code>)
              <p className="text-slate-400 text-[10px]">
                Active sheet for the current year. If missing, the app automatically creates it with all dates pre-filled from Jan 1 to Dec 31!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white font-mono">TagsMaster</span>
              <p className="text-slate-400 text-[10px]">
                Holds your tag badges, color hex codes, and descriptions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Column Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-xs">
          <Tag className="w-4 h-4" />
          <span>3. Required Column Structure (Row 1)</span>
        </div>

        <p className="text-slate-300 text-[11px]">
          Row 1 in <code className="text-indigo-300 font-mono">LifeLogger_YYYY</code> MUST have the exact following headers:
        </p>

        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-2">
            <span className="text-indigo-400 font-bold block">Col A</span>
            <span className="text-white">Date</span>
            <span className="text-slate-500 text-[9px] block">YYYY-MM-DD</span>
          </div>
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-2">
            <span className="text-indigo-400 font-bold block">Col B</span>
            <span className="text-white">Activities</span>
            <span className="text-slate-500 text-[9px] block">gym, reading</span>
          </div>
          <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-2">
            <span className="text-indigo-400 font-bold block">Col C</span>
            <span className="text-white">Description</span>
            <span className="text-slate-500 text-[9px] block">Journal notes</span>
          </div>
        </div>
      </div>

      {/* 4. Strict Validation & Fail-Fast */}
      <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-4 shadow-lg space-y-2">
        <div className="flex items-center space-x-2 text-rose-400 font-semibold text-xs">
          <ShieldAlert className="w-4 h-4" />
          <span>4. Strict Fail-Fast Validation</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          If your sheet exists but Row 1 headers do not match <code className="text-white font-mono">Date | Activities | Description</code>, the app halts sync and displays an error modal to prevent corrupting your sheet data.
        </p>
      </div>
    </div>
  );
};
