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
  ConventionError,
} from './services/googleSheets';
import { Calendar, History, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';

const HARDCODED_CLIENT_ID = '695101244362-8pt7gjspk7g10m3ep59o6mohsgk916tv.apps.googleusercontent.com';

const getInitialSpreadsheetId = (): string => {
  const stored = localStorage.getItem('life_logger_sheet_id');
  if (stored) return extractSpreadsheetId(stored);
  const envVal = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
  if (envVal) return extractSpreadsheetId(envVal);
  return '';
};

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: getInitialSpreadsheetId(),
  clientId: HARDCODED_CLIENT_ID,
  sheetYear: 'LifeLogger_2026',
  tagMasterSheet: 'Tag Master',
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'docs'>('log');

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
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

  // Save config changes
  const handleSaveConfig = (newConfig: AppConfig) => {
    const cleanId = extractSpreadsheetId(newConfig.spreadsheetId);
    const updatedConfig = { ...newConfig, spreadsheetId: cleanId, clientId: HARDCODED_CLIENT_ID };
    setConfig(updatedConfig);
    localStorage.setItem('life_logger_sheet_id', cleanId);
    localStorage.setItem('life_logger_client_id', HARDCODED_CLIENT_ID);
    showToast('Configuration updated!');
  };

  // Initialize Google Auth GIS Client
  useEffect(() => {
    initGoogleAuth(HARDCODED_CLIENT_ID, (token) => {
      setAccessToken(token);
      showToast('Authenticated with Google!');
    });
  }, []);

  // Load tags and logs when authenticated
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

  const handleAddCustomTag = (newTagName: string) => {
    if (!tags.some((t) => t.name === newTagName)) {
      const newTag: Tag = {
        name: newTagName,
        color: '#8B5CF6',
      };
      setTags((prev) => [...prev, newTag]);
    }
  };

  const handleSaveLog = async () => {
    if (!accessToken) {
      showToast('Please click Google Login first!', 'error');
      requestGoogleLogin();
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

  const currentEntryHasData =
    selectedTags.length > 0 || description.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      {/* Clean Ultra-Minimal Top Header */}
      <Header
        isAuthenticated={!!accessToken}
        onLogin={requestGoogleLogin}
        onLogout={() => {
          logoutGoogle();
          setAccessToken(null);
          showToast('Signed out of Google');
        }}
        onRefresh={loadSheetData}
        isSyncing={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4">
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
            />

            <TagSelector
              availableTags={tags}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onAddCustomTag={handleAddCustomTag}
            />

            <LogForm
              description={description}
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
          <DocsView config={config} onSaveConfig={handleSaveConfig} />
        )}
      </main>

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'log'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Daily Log</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Timeline ({logs.filter(l => l.activities?.length || l.description).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'docs'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Guide & Settings</span>
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-medium shadow-2xl border ${
              toast.type === 'error'
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : 'bg-emerald-950 border-emerald-800 text-emerald-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
