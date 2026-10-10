import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DateSelector } from './components/DateSelector';
import { TagSelector } from './components/TagSelector';
import { LogForm } from './components/LogForm';
import { LogHistory } from './components/LogHistory';
import { DocsView } from './components/DocsView';
import { ErrorModal } from './components/ErrorModal';
import type { AppConfig, LogEntry, Tag } from './types';
import { extractSpreadsheetId } from './utils/urlParser';
import { getLocalDateString } from './utils/dateUtils';
import {
  initGoogleAuth,
  requestGoogleLogin,
  getStoredAccessToken,
  logoutGoogle,
} from './services/googleAuth';
import {
  fetchTags,
  fetchLogEntries,
  updateLogEntry,
  appendTagToMaster,
  ConventionError,
} from './services/googleSheets';
import { Calendar, History, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';

import { FloatingAiButton } from './components/FloatingAiButton';

const HARDCODED_CLIENT_ID = '695101244362-8pt7gjspk7g10m3ep59o6mohsgk916tv.apps.googleusercontent.com';

const getInitialSpreadsheetId = (): string => {
  const stored = localStorage.getItem('life_logger_sheet_id');
  if (stored) return extractSpreadsheetId(stored);
  const envVal = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
  if (envVal) return extractSpreadsheetId(envVal);
  return '';
};

const getInitialYear = (): string => {
  const stored = localStorage.getItem('life_logger_sheet_year');
  if (stored) {
    const match = stored.match(/\d{4}/);
    if (match) return match[0];
  }
  return new Date().getFullYear().toString();
};

const initialYear = getInitialYear();

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: getInitialSpreadsheetId(),
  clientId: HARDCODED_CLIENT_ID,
  sheetYear: `LifeLogger_${initialYear}`,
  tagMasterSheet: 'TagsMaster',
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [selectedYear, setSelectedYear] = useState<string>(initialYear);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('life_logger_gemini_api_key') || ''
  );
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'docs'>('log');

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');

  const [tags, setTags] = useState<Tag[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Unified Error Modal State
  const [errorModal, setErrorModal] = useState<{
    title: string;
    message: string;
    details?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginClick = () => {
    requestGoogleLogin(HARDCODED_CLIENT_ID, (token) => {
      setAccessToken(token);
      showToast('Authenticated with Google!');
    });
  };

  // Save config changes
  const handleSaveConfig = (newConfig: AppConfig, apiKey?: string) => {
    const cleanId = extractSpreadsheetId(newConfig.spreadsheetId);
    const updatedConfig = { ...newConfig, spreadsheetId: cleanId, clientId: HARDCODED_CLIENT_ID };
    setConfig(updatedConfig);
    localStorage.setItem('life_logger_sheet_id', cleanId);
    localStorage.setItem('life_logger_client_id', HARDCODED_CLIENT_ID);
    if (apiKey !== undefined) {
      setGeminiApiKey(apiKey);
      localStorage.setItem('life_logger_gemini_api_key', apiKey);
    }
    showToast('Configuration updated!');
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    const newSheetYear = `LifeLogger_${newYear}`;
    const updatedConfig = { ...config, sheetYear: newSheetYear };
    setConfig(updatedConfig);
    localStorage.setItem('life_logger_sheet_year', newSheetYear);

    const parts = selectedDate.split('-');
    if (parts[0] !== newYear) {
      setSelectedDate(`${newYear}-${parts[1] || '01'}-${parts[2] || '01'}`);
    }
    showToast(`Switched to ${newYear} sheet!`);
  };

  // Initialize Google Auth GIS Client on mount
  useEffect(() => {
    initGoogleAuth(HARDCODED_CLIENT_ID, (token) => {
      setAccessToken(token);
      showToast('Authenticated with Google!');
    });
  }, []);

  // Load live tags and logs when authenticated
  const loadSheetData = async () => {
    if (!accessToken || !config.spreadsheetId) return;
    setIsLoading(true);
    setErrorModal(null);
    try {
      const [fetchedTags, fetchedLogs] = await Promise.all([
        fetchTags(config.spreadsheetId, accessToken),
        fetchLogEntries(config.spreadsheetId, config.sheetYear, accessToken),
      ]);
      setTags(fetchedTags);
      setLogs(fetchedLogs);
    } catch (error: any) {
      console.error('Data load error:', error);
      if (error instanceof ConventionError) {
        setErrorModal({
          title: 'Workspace Convention Error',
          message: error.message,
          details: error.details,
        });
      } else {
        setErrorModal({
          title: 'Google Sheet Sync Failed',
          message: error.message || 'Unable to read data from Google Sheet. Verify your Spreadsheet URL/ID.',
          details: 'Ensure your sheet URL is valid and your Google account has access to the sheet.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && config.spreadsheetId) {
      loadSheetData();
    }
  }, [accessToken, config.spreadsheetId, config.sheetYear]);

  // Whenever selected date changes, find and prefill existing log entry
  useEffect(() => {
    const existing = logs.find((l) => l.date === selectedDate);
    if (existing) {
      setSelectedTags(existing.activities || []);
      setDescription(existing.description || '');
    } else {
      setSelectedTags([]);
      setDescription('');
    }
  }, [selectedDate, logs]);

  const handleToggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleAddCustomTag = async (newTag: Tag) => {
    setTags((prev) => [...prev, newTag]);
    if (accessToken && config.spreadsheetId) {
      try {
        await appendTagToMaster(config.spreadsheetId, newTag, accessToken);
        showToast(`Added #${newTag.name} to Tag Master sheet!`);
      } catch (error) {
        console.error('Failed to sync new tag to Tag Master:', error);
      }
    }
  };

  const handleSaveLog = async () => {
    if (!accessToken) {
      showToast('Please click Google Login first!', 'error');
      handleLoginClick();
      return;
    }

    if (!config.spreadsheetId) {
      setErrorModal({
        title: 'Missing Spreadsheet URL',
        message: 'Please paste your Google Sheet URL in the Guide & Settings tab before saving logs.',
      });
      setActiveTab('docs');
      return;
    }

    setIsSaving(true);
    try {
      const entryToSave: LogEntry = {
        date: selectedDate,
        activities: selectedTags,
        description,
      };

      await updateLogEntry(
        config.spreadsheetId,
        config.sheetYear,
        entryToSave,
        accessToken
      );

      setLogs((prev) => {
        const index = prev.findIndex((l) => l.date === selectedDate);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...entryToSave };
          return updated;
        } else {
          return [...prev, entryToSave];
        }
      });

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      showToast(`Saved log for ${selectedDate}!`);
    } catch (error: any) {
      console.error('Save error:', error);
      setErrorModal({
        title: 'Save Failed',
        message: error.message || 'Failed to save log entry to Google Sheet.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectHistoryEntry = (entry: LogEntry) => {
    setSelectedDate(entry.date);
    setActiveTab('log');
  };

  const savedEntry = logs.find((l) => l.date === selectedDate);
  const currentEntryHasData = Boolean(
    savedEntry &&
      (savedEntry.activities || []).length > 0 &&
      (savedEntry.description || '').trim().length > 0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-32 overflow-x-hidden max-w-[100vw]">
      {/* Clean Ultra-Minimal Top Header */}
      <Header
        isAuthenticated={!!accessToken}
        onLogin={handleLoginClick}
        onLogout={() => {
          logoutGoogle();
          setAccessToken(null);
          showToast('Signed out of Google');
        }}
        onRefresh={loadSheetData}
        isSyncing={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto pt-24 p-4">
        {/* Banner if Google Spreadsheet URL missing */}
        {!config.spreadsheetId && (
          <div
            onClick={() => setActiveTab('docs')}
            className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 mb-4 text-xs text-amber-200 flex items-start space-x-3 cursor-pointer hover:border-amber-700 transition-all shadow-lg"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Spreadsheet URL Required</p>
              <p className="text-amber-200/80 mt-1">
                Tap here to open the <b>Guide & Settings</b> tab and paste your Google Sheet URL.
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Daily Log Entry */}
        {activeTab === 'log' && (
          <div className="animate-in fade-in duration-200">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
            />

            <TagSelector
              availableTags={tags}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onAddCustomTag={handleAddCustomTag}
            />

            <LogForm
              selectedDate={selectedDate}
              description={description}
              selectedTags={selectedTags}
              availableTags={tags}
              onChangeDescription={setDescription}
              onSave={handleSaveLog}
              isSaving={isSaving}
              hasExistingData={currentEntryHasData}
            />
          </div>
        )}

        {/* Tab 2: History Feed */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-200">
            <LogHistory
              entries={logs}
              availableTags={tags}
              onSelectEntry={handleSelectHistoryEntry}
            />
          </div>
        )}

        {/* Tab 3: Docs / Guide & Settings */}
        {activeTab === 'docs' && (
          <DocsView
            config={config}
            geminiApiKey={geminiApiKey}
            onSaveConfig={handleSaveConfig}
          />
        )}
      </main>

      {/* Floating AI Voice Log Assistant Button (Daily Log tab only) */}
      {activeTab === 'log' && (
        <FloatingAiButton
          availableTags={tags}
          accessToken={accessToken}
          geminiApiKey={geminiApiKey}
          onPrefillLog={(aiTags, aiDescription) => {
            setSelectedTags(aiTags);
            setDescription(aiDescription);
          }}
          showToast={showToast}
        />
      )}

      {/* Native Mobile Rigid Bottom Navigation Bar (Matched h-20 height with Header) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 shadow-2xl flex items-center">
        <div className="grid grid-cols-3 max-w-md mx-auto w-full items-center text-center gap-2 h-full py-2">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'log'
                ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className={`w-5 h-5 mb-1 ${activeTab === 'log' ? 'text-indigo-400' : ''}`} />
            <span className="text-xs font-semibold tracking-tight">Daily Log</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className={`w-5 h-5 mb-1 ${activeTab === 'history' ? 'text-indigo-400' : ''}`} />
            <span className="text-xs font-semibold tracking-tight">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'docs' ? 'text-indigo-400' : ''}`} />
            <span className="text-xs font-semibold tracking-tight">Guide</span>
          </button>
        </div>
      </nav>

      {/* Reusable Error Modal (Unified Error Pop-up) */}
      {errorModal && (
        <ErrorModal
          title={errorModal.title}
          message={errorModal.message}
          details={errorModal.details}
          onClose={() => setErrorModal(null)}
          onOpenDocs={() => setActiveTab('docs')}
          onRetry={loadSheetData}
        />
      )}

      {/* Floating Toast Notification (Single-Line No Wrap Fix) */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-200 max-w-[90vw]">
          <div
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-2xl border whitespace-nowrap ${
              toast.type === 'error'
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : 'bg-emerald-950 border-emerald-800 text-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
