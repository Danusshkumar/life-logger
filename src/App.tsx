import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DateSelector } from './components/DateSelector';
import { TagSelector } from './components/TagSelector';
import { LogForm } from './components/LogForm';
import { LogHistory } from './components/LogHistory';
import type { AppConfig, LogEntry, Tag } from './types';
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
} from './services/googleSheets';
import { Calendar, History, AlertTriangle, ShieldCheck } from 'lucide-react';

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: localStorage.getItem('life_logger_sheet_id') || '',
  clientId: localStorage.getItem('life_logger_client_id') || '',
  sheetYear: 'LifeLogger_2026',
  tagMasterSheet: 'Tag Master',
};

export default function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredAccessToken());
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');

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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Save config changes to localStorage
  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('life_logger_sheet_id', newConfig.spreadsheetId);
    localStorage.setItem('life_logger_client_id', newConfig.clientId);
    showToast('Settings saved successfully!');
    if (newConfig.clientId) {
      initGoogleAuth(newConfig.clientId, (token) => {
        setAccessToken(token);
        showToast('Successfully authenticated with Google!');
      });
    }
  };

  // Initialize Google Auth GIS Client
  useEffect(() => {
    if (config.clientId) {
      initGoogleAuth(config.clientId, (token) => {
        setAccessToken(token);
        showToast('Successfully authenticated with Google!');
      });
    }
  }, [config.clientId]);

  // Load tags and logs when authenticated
  const loadSheetData = async () => {
    if (!accessToken || !config.spreadsheetId) return;
    setIsLoading(true);
    try {
      const [fetchedTags, fetchedLogs] = await Promise.all([
        fetchTags(config.spreadsheetId, accessToken),
        fetchLogEntries(config.spreadsheetId, config.sheetYear, accessToken),
      ]);
      setTags(fetchedTags);
      setLogs(fetchedLogs);
    } catch (error: any) {
      console.error('Data load error:', error);
      showToast(error.message || 'Error loading Google Sheet data', 'error');
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
        color: '#8B5CF6', // Default violet accent
      };
      setTags((prev) => [...prev, newTag]);
    }
  };

  const handleSaveLog = async () => {
    if (!accessToken) {
      showToast('Please sign in with Google first!', 'error');
      requestGoogleLogin();
      return;
    }

    if (!config.spreadsheetId) {
      showToast('Please configure your Google Spreadsheet ID in Settings!', 'error');
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

      // Refresh local state logs
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

      // Trigger phone vibration feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      showToast(`Saved log for ${selectedDate}!`);
    } catch (error: any) {
      console.error('Save error:', error);
      showToast(error.message || 'Failed to save log entry', 'error');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-16">
      {/* Header Bar */}
      <Header
        isAuthenticated={!!accessToken}
        onLogin={requestGoogleLogin}
        onLogout={() => {
          logoutGoogle();
          setAccessToken(null);
          showToast('Signed out of Google');
        }}
        config={config}
        onSaveConfig={handleSaveConfig}
        onRefresh={loadSheetData}
        isSyncing={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4">
        {/* Banner if Google Client ID or Spreadsheet ID missing */}
        {(!config.clientId || !config.spreadsheetId) && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-4 mb-4 text-xs text-amber-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Quick Configuration Needed</p>
              <p className="text-amber-200/80 mt-1">
                Tap the ⚙️ Settings icon in the top header to enter your <b>Google Spreadsheet ID</b> and <b>Client ID</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher Bar */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mb-4 shadow-inner">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'log'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Enter Daily Log</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl font-medium text-xs transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Timeline Feed ({logs.filter(l => l.activities?.length || l.description).length})</span>
          </button>
        </div>

        {/* Tab Content 1: Daily Log Entry */}
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

        {/* Tab Content 2: History Feed */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-200">
            <LogHistory
              entries={logs}
              availableTags={tags}
              onSelectEntry={handleSelectHistoryEntry}
            />
          </div>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-200">
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
