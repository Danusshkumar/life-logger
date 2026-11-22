import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  FileCode2,
  FolderOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  AlertCircle,
  FilePlus2,
  FileText,
  Copy,
  Check,
  Zap,
  Undo2,
  SlidersHorizontal,
  BookmarkCheck,
  Inbox as InboxIcon,
  Eraser,
  Sparkles,
  ArrowUpDown,
  Save,
} from 'lucide-react';
import type { CategoryMapperData, VendorMapping } from '../types';

interface CategoryMapperViewProps {
  onBack?: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

type TabType = 'mapped' | 'inbox' | 'prune';
type SortOption = 'frequency' | 'last_seen' | 'name';
type SortDirection = 'desc' | 'asc';
type PruneTarget = 'all' | 'unindexed' | 'indexed';

const getRelativeDaysText = (dateString: string): string => {
  if (!dateString) return 'Never';
  const now = new Date();
  const past = new Date(dateString);
  const diffTime = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

export const CategoryMapperView: React.FC<CategoryMapperViewProps> = ({
  onBack,
  showToast = (msg) => alert(msg),
}) => {
  // File state
  const [data, setData] = useState<CategoryMapperData>({});
  const [isFileLoaded, setIsFileLoaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('category_mapper.json');
  const [hasFileHandle, setHasFileHandle] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const fileHandleRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Tab: 'mapped' | 'inbox' | 'prune'
  const [activeTab, setActiveTab] = useState<TabType>('mapped');

  // Search & Sorting (with toggleable direction)
  const [search, setSearch] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('frequency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modal State for Add / Edit / Index Entry
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingVendorKey, setEditingVendorKey] = useState<string | null>(null);
  const [inputVendor, setInputVendor] = useState<string>('');
  const [inputIsIndexed, setInputIsIndexed] = useState<boolean>(true);
  const [inputCategory, setInputCategory] = useState<string>('');
  const [inputTitle, setInputTitle] = useState<string>('');
  const [inputDescription, setInputDescription] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // Prune Filter Options
  const [pruneTarget, setPruneTarget] = useState<PruneTarget>('unindexed');
  const [pruneMaxFrequency, setPruneMaxFrequency] = useState<number>(1); // <= 1
  const [pruneOlderThanDays, setPruneOlderThanDays] = useState<number>(0); // 0 = any time

  // Extract unique categories across loaded mappings for datalist
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    Object.values(data).forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Counts
  const { indexedCount, unindexedCount, totalCount } = useMemo(() => {
    let indexed = 0;
    let unindexed = 0;
    Object.values(data).forEach((item) => {
      if (item.is_indexed) indexed++;
      else unindexed++;
    });
    return {
      indexedCount: indexed,
      unindexedCount: unindexed,
      totalCount: indexed + unindexed,
    };
  }, [data]);

  // Strict parser
  const parseJsonToSchema = (parsed: any): CategoryMapperData => {
    const result: CategoryMapperData = {};

    Object.entries(parsed).forEach(([key, val]: [string, any]) => {
      if (val && typeof val === 'object') {
        result[key.trim()] = {
          is_indexed: Boolean(val.is_indexed),
          category: String(val.category || '').trim(),
          title: String(val.title || '').trim(),
          description: String(val.description || '').trim(),
          frequency: Number(val.frequency) || 1,
          last_seen: String(val.last_seen || '').trim(),
        };
      }
    });
    return result;
  };

  // Open file with File System Access API
  const handleOpenFile = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
          multiple: false,
        });

        const file = await handle.getFile();
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          showToast('JSON must be an object with vendor keys.', 'error');
          return;
        }

        const normalized = parseJsonToSchema(parsed);
        fileHandleRef.current = handle;
        setHasFileHandle(true);
        setFileName(file.name);
        setData(normalized);
        setIsFileLoaded(true);
        setIsDirty(false);
        showToast(`Loaded ${Object.keys(normalized).length} vendors from ${file.name}!`, 'success');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('File pick error:', err);
          showToast('Failed to open file. Please verify JSON format.', 'error');
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // Fallback file input change handler
  const handleFallbackFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        showToast('JSON must be an object with vendor keys.', 'error');
        return;
      }

      const normalized = parseJsonToSchema(parsed);
      setFileName(file.name);
      setData(normalized);
      setIsFileLoaded(true);
      setHasFileHandle(false);
      setIsDirty(false);
      showToast(`Loaded ${Object.keys(normalized).length} vendors from ${file.name}!`, 'success');
    } catch (err) {
      console.error('File read error:', err);
      showToast('Invalid JSON file format.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Create empty file
  const handleCreateNewFile = () => {
    setData({});
    setFileName('category_mapper.json');
    fileHandleRef.current = null;
    setHasFileHandle(false);
    setIsFileLoaded(true);
    setIsDirty(true);
    showToast('Created new empty mapping file.', 'success');
  };

  // Save directly to device file
  const handleSaveFile = async () => {
    const jsonString = JSON.stringify(data, null, 2);

    if (hasFileHandle && fileHandleRef.current) {
      try {
        const writable = await fileHandleRef.current.createWritable();
        await writable.write(jsonString);
        await writable.close();
        setIsDirty(false);
        showToast(`Saved to ${fileName}!`, 'success');
        return;
      } catch (err: any) {
        console.warn('Direct file write failed, trying Save As:', err);
      }
    }

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName || 'category_mapper.json',
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        fileHandleRef.current = handle;
        setHasFileHandle(true);
        setFileName(handle.name);
        setIsDirty(false);
        showToast(`Saved to ${handle.name}!`, 'success');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'category_mapper.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDirty(false);
    showToast(`Saved ${fileName}!`, 'success');
  };

  // Copy full JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedJson(true);
    showToast('JSON copied to clipboard!', 'success');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Handle Sort button click: toggle asc/desc if already active
  const handleSortClick = (option: SortOption) => {
    if (sortOption === option) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortOption(option);
      setSortDirection(option === 'name' ? 'asc' : 'desc');
    }
  };

  // Open Add modal (No frequency or last_seen editing)
  const handleOpenAdd = () => {
    setEditingVendorKey(null);
    setInputVendor('');
    setInputIsIndexed(activeTab === 'mapped');
    setInputCategory(uniqueCategories[0] || 'Food & Dining');
    setInputTitle('');
    setInputDescription('');
    setModalError('');
    setShowModal(true);
  };

  // Open Edit modal (No frequency or last_seen editing)
  const handleOpenEdit = (vendorKey: string, mapping: VendorMapping) => {
    setEditingVendorKey(vendorKey);
    setInputVendor(vendorKey);
    setInputIsIndexed(mapping.is_indexed);
    setInputCategory(mapping.category);
    setInputTitle(mapping.title);
    setInputDescription(mapping.description || '');
    setModalError('');
    setShowModal(true);
  };

  // Quick Index modal from Inbox
  const handleOpenIndexFromInbox = (vendorKey: string, mapping: VendorMapping) => {
    setEditingVendorKey(vendorKey);
    setInputVendor(vendorKey);
    setInputIsIndexed(true);
    setInputCategory(uniqueCategories[0] || 'Unknown');
    setInputTitle(vendorKey);
    setInputDescription(mapping.description || '');
    setModalError('');
    setShowModal(true);
  };

  // Save Modal: maintains existing frequency & last_seen untouched
  const handleSaveModal = () => {
    const vendor = inputVendor.trim();
    const category = inputCategory.trim();
    const title = inputTitle.trim();
    const description = inputDescription.trim();

    if (!vendor) {
      setModalError('Vendor name is required.');
      return;
    }

    if (inputIsIndexed) {
      if (!category) {
        setModalError('Category is required for mapped vendors.');
        return;
      }
      if (!title) {
        setModalError('Transaction title is required for mapped vendors.');
        return;
      }
    }

    if (
      !editingVendorKey &&
      Object.keys(data).some((k) => k.toLowerCase() === vendor.toLowerCase())
    ) {
      setModalError(`An entry for "${vendor}" already exists.`);
      return;
    }

    setData((prev) => {
      const next = { ...prev };
      const existing = editingVendorKey ? prev[editingVendorKey] : null;

      if (editingVendorKey && editingVendorKey !== vendor) {
        delete next[editingVendorKey];
      }

      next[vendor] = {
        is_indexed: inputIsIndexed,
        category: inputIsIndexed ? category : '',
        title: inputIsIndexed ? title : '',
        description,
        frequency: existing?.frequency || 1,
        last_seen: existing?.last_seen || new Date().toISOString().slice(0, 10),
      };
      return next;
    });

    setIsDirty(true);
    setShowModal(false);
    showToast(
      editingVendorKey ? `Updated ${vendor}` : `Added ${vendor}`,
      'success'
    );
  };

  // Demote Mapped Vendor to Inbox
  const handleDemoteToInbox = (vendorKey: string) => {
    setData((prev) => {
      const next = { ...prev };
      if (next[vendorKey]) {
        next[vendorKey] = {
          ...next[vendorKey],
          is_indexed: false,
        };
      }
      return next;
    });
    setIsDirty(true);
    showToast(`Demoted "${vendorKey}" to Inbox`, 'success');
  };

  // Delete vendor entry
  const handleDelete = (vendorKey: string) => {
    if (window.confirm(`Delete entry for "${vendorKey}"?`)) {
      setData((prev) => {
        const next = { ...prev };
        delete next[vendorKey];
        return next;
      });
      setIsDirty(true);
      showToast(`Removed "${vendorKey}"`, 'success');
    }
  };

  // Filtered & Sorted Lists with Ascending/Descending Support
  const { displayedList, pruneMatchingList } = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sorter = (a: [string, VendorMapping], b: [string, VendorMapping]) => {
      let comparison = 0;
      if (sortOption === 'frequency') {
        comparison = (a[1].frequency || 0) - (b[1].frequency || 0);
        if (comparison === 0) {
          comparison = (a[1].last_seen || '').localeCompare(b[1].last_seen || '');
        }
      } else if (sortOption === 'last_seen') {
        comparison = (a[1].last_seen || '').localeCompare(b[1].last_seen || '');
        if (comparison === 0) {
          comparison = (a[1].frequency || 0) - (b[1].frequency || 0);
        }
      } else {
        comparison = a[0].localeCompare(b[0]);
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    };

    // Tab 1 & Tab 2 display list
    const tabFiltered = Object.entries(data)
      .filter(([vendor, mapping]) => {
        if (activeTab === 'mapped') {
          if (!mapping.is_indexed) return false;
        } else if (activeTab === 'inbox') {
          if (mapping.is_indexed) return false;
        } else {
          return true;
        }

        if (!query) return true;
        return (
          vendor.toLowerCase().includes(query) ||
          mapping.category.toLowerCase().includes(query) ||
          mapping.title.toLowerCase().includes(query) ||
          (mapping.description && mapping.description.toLowerCase().includes(query))
        );
      })
      .sort(sorter);

    // Tab 3 Prune matching list
    const now = new Date().getTime();
    const pruneList = Object.entries(data)
      .filter(([vendor, mapping]) => {
        if (pruneTarget === 'unindexed' && mapping.is_indexed) return false;
        if (pruneTarget === 'indexed' && !mapping.is_indexed) return false;

        if (pruneMaxFrequency > 0 && mapping.frequency > pruneMaxFrequency) {
          return false;
        }

        if (pruneOlderThanDays > 0) {
          if (!mapping.last_seen) return false;
          const past = new Date(mapping.last_seen).getTime();
          const diffDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));
          if (diffDays < pruneOlderThanDays) return false;
        }

        if (!query) return true;
        return (
          vendor.toLowerCase().includes(query) ||
          mapping.category.toLowerCase().includes(query) ||
          mapping.title.toLowerCase().includes(query) ||
          (mapping.description && mapping.description.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => (a[1].frequency || 0) - (b[1].frequency || 0));

    return {
      displayedList: tabFiltered,
      pruneMatchingList: pruneList,
    };
  }, [
    data,
    activeTab,
    search,
    sortOption,
    sortDirection,
    pruneTarget,
    pruneMaxFrequency,
    pruneOlderThanDays,
  ]);

  // Execute Bulk Delete from Prune View
  const handleExecuteBulkPrune = () => {
    const count = pruneMatchingList.length;
    if (count === 0) return;

    if (
      window.confirm(
        `Are you sure you want to permanently delete all ${count} matching vendors?`
      )
    ) {
      const keysToRemove = new Set(pruneMatchingList.map(([key]) => key));
      setData((prev) => {
        const next = { ...prev };
        keysToRemove.forEach((key) => delete next[key]);
        return next;
      });
      setIsDirty(true);
      showToast(`Pruned ${count} vendors successfully. Remember to Save.`, 'success');
    }
  };

  // Render Vendor Card (Used consistently across Mapped, Inbox, and Prune lists)
  const renderVendorCard = (vendor: string, mapping: VendorMapping) => {
    return (
      <div
        key={vendor}
        className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-3 transition-all"
      >
        {/* Row 1: Vendor Name + Status Pill on Left, 3 Distinct Buttons on Right */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="font-bold text-sm sm:text-base text-white truncate">
              {vendor}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                mapping.is_indexed
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {mapping.is_indexed ? 'Mapped' : 'Inbox'}
            </span>
            {!mapping.is_indexed && mapping.frequency >= 3 && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border border-indigo-500/40 bg-indigo-500/15 text-indigo-300 text-[10px] font-bold shrink-0">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                <span>Recurring</span>
              </span>
            )}
          </div>

          {/* Three Action Buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Button 1: Edit (if mapped) or Index (if inbox) */}
            {mapping.is_indexed ? (
              <button
                type="button"
                onClick={() => handleOpenEdit(vendor, mapping)}
                title="Edit entry"
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenIndexFromInbox(vendor, mapping)}
                title="Index into Cashew"
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Index</span>
              </button>
            )}

            {/* Button 2: Demote (if mapped) or Edit (if inbox) */}
            {mapping.is_indexed ? (
              <button
                type="button"
                onClick={() => handleDemoteToInbox(vendor)}
                title="Demote to Inbox"
                className="p-2 text-slate-400 hover:text-amber-300 bg-slate-800/80 hover:bg-amber-500/15 border border-slate-700/80 hover:border-amber-500/30 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenEdit(vendor, mapping)}
                title="Edit entry details"
                className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Button 3: Delete */}
            <button
              type="button"
              onClick={() => handleDelete(vendor)}
              title="Delete entry"
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 hover:bg-rose-500/15 border border-slate-700/80 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Category and Title (Clean UI, No arbitrary colors) */}
        <div className="flex items-center gap-2 flex-wrap">
          {mapping.is_indexed ? (
            <>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cat:</span>
                <span className="text-xs font-bold text-slate-200">{mapping.category}</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-800 rounded-lg min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title:</span>
                <span className="text-xs font-semibold text-white truncate">{mapping.title}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/40 border border-slate-800 rounded-lg text-slate-400 text-xs">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Unmapped payee · Awaiting Cashew categorization</span>
            </div>
          )}
        </div>

        {/* Row 3: Description UI (With Description or Without Description) */}
        {mapping.description ? (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{mapping.description}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 text-[11px] text-slate-500">
            <FileText className="w-3 h-3 text-slate-600 shrink-0" />
            <span>No description added</span>
          </div>
        )}

        {/* Row 4: Metadata Footer (Frequency + Last Seen) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-200 border border-slate-700/60">
              {mapping.frequency} {mapping.frequency === 1 ? 'time' : 'times'}
            </span>
            <span className="text-slate-500">frequency</span>
          </div>
          <div className="text-slate-400">
            Last: <span className="text-slate-300 font-semibold">{mapping.last_seen || 'Never'}</span> ({getRelativeDaysText(mapping.last_seen)})
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-28 animate-in fade-in duration-200 text-slate-100 font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFallbackFileSelect}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              Category Mapper
            </h2>
            <p className="text-xs text-slate-400 truncate">
              Cashew transaction notification vendor dictionary
            </p>
          </div>
        </div>

        {isFileLoaded && (
          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy full JSON"
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700 shadow-sm transition-all cursor-pointer shrink-0"
          >
            {copiedJson ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Copy JSON</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* STATE 1: NO FILE OPENED */}
      {!isFileLoaded ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              No Mapping File Opened
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Open your Cashew mapping file to review mapped vendors, organize inbox discoveries, and bulk prune inactive entries.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={handleOpenFile}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Open JSON File</span>
            </button>

            <button
              onClick={handleCreateNewFile}
              className="flex items-center space-x-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4 text-slate-400" />
              <span>Create Empty Mapping</span>
            </button>
          </div>
        </div>
      ) : (
        /* STATE 2: ACTIVE WORKSPACE */
        <>
          {/* File Status Bar (Compact Save button on far right) */}
          <div
            className={`border rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all ${
              isDirty
                ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isDirty
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}
                >
                  <FileText className="w-4.5 h-4.5" />
                </div>

                <div className="min-w-0">
                  {/* Plain text when dirty; editable input only when cleanly saved */}
                  {isDirty ? (
                    <span className="text-sm sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-md block">
                      {fileName}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => {
                        setFileName(e.target.value);
                        setIsDirty(true);
                      }}
                      title="Click to rename file"
                      className="text-sm sm:text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors truncate max-w-[160px] sm:max-w-md block"
                    />
                  )}

                  <div className="flex items-center space-x-2 text-[11px] font-medium mt-0.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                      }`}
                    />
                    <span className={isDirty ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {isDirty
                        ? `Unsaved · ${indexedCount} mapped · ${unindexedCount} inbox`
                        : `${indexedCount} mapped · ${unindexedCount} inbox · ${totalCount} total`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Save Button on far right */}
              <button
                type="button"
                onClick={handleSaveFile}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 ml-auto shadow-sm ${
                  isDirty
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 ring-1 ring-amber-400/60'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Unified Compact Segmented Control (Tabs) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-sm gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('mapped')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'mapped'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Mapped</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                {indexedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'inbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <InboxIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Inbox</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                {unindexedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prune')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'prune'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Eraser className="w-3.5 h-3.5 shrink-0" />
              <span>Prune</span>
            </button>
          </div>

          {/* Search Row: Search Input + Add Button */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'prune'
                      ? 'Search prune list...'
                      : activeTab === 'inbox'
                      ? 'Search inbox...'
                      : 'Search mapped vendors, categories, notes...'
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 text-xs sm:text-sm font-bold text-white placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeTab !== 'prune' && (
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  title="Add Vendor"
                  className="w-11 h-11 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort Row: Full-Width 3-Column Sorter Grid */}
            {activeTab !== 'prune' && (
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => handleSortClick('frequency')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    sortOption === 'frequency'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Toggle frequency sort order"
                >
                  <span>Count</span>
                  <span className="text-[11px] font-black">
                    {sortOption === 'frequency' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSortClick('last_seen')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    sortOption === 'last_seen'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Toggle last seen sort order"
                >
                  <span>Recent</span>
                  <span className="text-[11px] font-black">
                    {sortOption === 'last_seen' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSortClick('name')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    sortOption === 'name'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                  title="Toggle alphabetical order"
                >
                  <span>A-Z</span>
                  <span className="text-[11px] font-black">
                    {sortOption === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: MAPPED VENDORS */}
          {activeTab === 'mapped' && (
            <div className="space-y-2.5">
              {displayedList.map(([vendor, mapping]) => renderVendorCard(vendor, mapping))}

              {displayedList.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 shadow-md space-y-1.5">
                  <BookmarkCheck className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-300">
                    {indexedCount === 0
                      ? 'No mapped vendors yet'
                      : 'No matching mapped vendors found'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {indexedCount === 0
                      ? 'Index vendors from your Inbox or click "+" to add your first Cashew mapping.'
                      : `No mapped vendor matches "${search}".`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-2.5">
              {displayedList.map(([vendor, mapping]) => renderVendorCard(vendor, mapping))}

              {displayedList.length === 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 shadow-md space-y-1.5">
                  <InboxIcon className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-300">
                    {unindexedCount === 0 ? 'Inbox is empty' : 'No matching inbox vendors found'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {unindexedCount === 0
                      ? 'When Automate scrapes new notifications, unmapped vendors will appear here for 1-click indexing.'
                      : `No inbox vendor matches "${search}".`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRUNE & BULK CLEANUP (With Custom Input & Quick Presets) */}
          {activeTab === 'prune' && (
            <div className="space-y-3.5">
              {/* 3-Field Rule Builder Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-800">
                  <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    Bulk Prune Rule Builder
                  </h3>
                </div>

                {/* Criteria 1: Target Group */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    1. Target Vendor Group
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['unindexed', 'indexed', 'all'] as PruneTarget[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPruneTarget(t)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                          pruneTarget === t
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {t === 'unindexed'
                          ? 'Inbox Only'
                          : t === 'indexed'
                          ? 'Mapped Only'
                          : 'All Vendors'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Criteria 2: Lifetime Frequency Threshold (3x2 Grid) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      2. Lifetime Frequency Threshold
                    </label>
                    <span className="text-xs text-indigo-300 font-semibold">
                      {pruneMaxFrequency === 0 ? 'Any count' : `≤ ${pruneMaxFrequency} times`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setPruneMaxFrequency(f)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          pruneMaxFrequency === f
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        ≤ {f}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPruneMaxFrequency(5)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        pruneMaxFrequency === 5
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      ≤ 5
                    </button>
                    <button
                      type="button"
                      onClick={() => setPruneMaxFrequency(0)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        pruneMaxFrequency === 0
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Any
                    </button>
                    <input
                      type="number"
                      min="0"
                      placeholder="Custom ≤"
                      value={![0, 1, 2, 3, 5].includes(pruneMaxFrequency) && pruneMaxFrequency > 0 ? pruneMaxFrequency : ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPruneMaxFrequency(isNaN(val) || val < 0 ? 0 : val);
                      }}
                      className={`w-full py-1.5 px-2 text-center rounded-lg text-xs font-bold border transition-all focus:outline-none focus:border-indigo-500 ${
                        ![0, 1, 2, 3, 5].includes(pruneMaxFrequency) && pruneMaxFrequency > 0
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-white placeholder:text-slate-500 border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Criteria 3: Inactivity (Last Seen Date) (3x2 Grid) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      3. Inactivity (Last Seen Date)
                    </label>
                    <span className="text-xs text-indigo-300 font-semibold">
                      {pruneOlderThanDays === 0
                        ? 'Any time'
                        : pruneOlderThanDays === 180
                        ? 'Older than 6 months'
                        : `Older than ${pruneOlderThanDays} days`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setPruneOlderThanDays(days)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          pruneOlderThanDays === days
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        &gt; {days}d
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPruneOlderThanDays(180)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        pruneOlderThanDays === 180
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      &gt; 6mo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPruneOlderThanDays(0)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        pruneOlderThanDays === 0
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Any
                    </button>
                    <input
                      type="number"
                      min="0"
                      placeholder="Custom > d"
                      value={![0, 30, 60, 90, 180].includes(pruneOlderThanDays) && pruneOlderThanDays > 0 ? pruneOlderThanDays : ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPruneOlderThanDays(isNaN(val) || val < 0 ? 0 : val);
                      }}
                      className={`w-full py-1.5 px-2 text-center rounded-lg text-xs font-bold border transition-all focus:outline-none focus:border-indigo-500 ${
                        ![0, 30, 60, 90, 180].includes(pruneOlderThanDays) && pruneOlderThanDays > 0
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                          : 'bg-slate-950/60 text-white placeholder:text-slate-500 border-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Bulk Action Header Banner (Strict Single Row) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-2 flex-nowrap">
                <div className="flex items-center space-x-2 min-w-0">
                  <span
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                      pruneMatchingList.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-bold text-white truncate">
                    Found {pruneMatchingList.length} matching {pruneMatchingList.length === 1 ? 'vendor' : 'vendors'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteBulkPrune}
                  disabled={pruneMatchingList.length === 0}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95 shrink-0 whitespace-nowrap ${
                    pruneMatchingList.length > 0
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Delete All ({pruneMatchingList.length})</span>
                </button>
              </div>

              {/* Live Preview List with Full Consistent Vendor Card UI */}
              <div className="space-y-2.5">
                {pruneMatchingList.map(([vendor, mapping]) => renderVendorCard(vendor, mapping))}

                {pruneMatchingList.length === 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 shadow-md space-y-1">
                    <p className="text-sm font-bold text-slate-300">
                      No vendors match the current prune criteria
                    </p>
                    <p className="text-xs text-slate-500">
                      Adjust the target group, frequency, or inactivity rules above to preview candidates.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Unified Add / Edit / Index Entry Modal (NO manual frequency or last_seen inputs) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-2xl text-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-base sm:text-lg text-white">
                {editingVendorKey
                  ? inputIsIndexed
                    ? 'Edit Mapped Vendor'
                    : 'Edit Inbox Payee'
                  : 'New Vendor Entry'}
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3 rounded-xl flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Field 1: Vendor Name */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Vendor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber, Amazon, Local Grocer"
                value={inputVendor}
                onChange={(e) => {
                  setInputVendor(e.target.value);
                  setModalError('');
                }}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Field 2: Indexing Status Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">
                  Map for Cashew Automation
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Automate will use Category and Title for this vendor
                </span>
              </div>
              <input
                type="checkbox"
                checked={inputIsIndexed}
                onChange={(e) => setInputIsIndexed(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Field 3: Category (only required if is_indexed) */}
            {inputIsIndexed && (
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  placeholder="e.g. Food & Dining, Transportation, Groceries"
                  value={inputCategory}
                  onChange={(e) => {
                    setInputCategory(e.target.value);
                    setModalError('');
                  }}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
                <datalist id="category-suggestions">
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            )}

            {/* Field 4: Transaction Title (only required if is_indexed) */}
            {inputIsIndexed && (
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Transaction Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food Delivery, Cab Ride, Online Shopping"
                  value={inputTitle}
                  onChange={(e) => {
                    setInputTitle(e.target.value);
                    setModalError('');
                  }}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            )}

            {/* Field 5: Description Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Description / Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Explain what shop this is, spending details, etc."
                value={inputDescription}
                onChange={(e) => setInputDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner resize-none"
              />
            </div>

            {/* Modal Buttons: Cancel on Left, Save on Right */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-11 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
              >
                {editingVendorKey ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
