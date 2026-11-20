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
} from 'lucide-react';
import type { CategoryMapperData, VendorMapping } from '../types';

interface CategoryMapperViewProps {
  onBack?: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'food & dining': '#F59E0B',
  transportation: '#38BDF8',
  shopping: '#EC4899',
  entertainment: '#A855F7',
  groceries: '#10B981',
  utilities: '#06B6D4',
  health: '#F43F5E',
  travel: '#6366F1',
  bills: '#14B8A6',
  personal: '#F97316',
};

const getCategoryColor = (categoryName: string): string => {
  const normalized = categoryName.trim().toLowerCase();
  return CATEGORY_COLORS[normalized] || '#818CF8';
};

export const CategoryMapperView: React.FC<CategoryMapperViewProps> = ({
  onBack,
  showToast = (msg) => alert(msg),
}) => {
  // File state - starts empty
  const [data, setData] = useState<CategoryMapperData>({});
  const [isFileLoaded, setIsFileLoaded] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('category_mapper.json');
  const [hasFileHandle, setHasFileHandle] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const fileHandleRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search filter
  const [search, setSearch] = useState<string>('');

  // Modal State for Add / Edit Entry
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingVendorKey, setEditingVendorKey] = useState<string | null>(null);
  const [inputVendor, setInputVendor] = useState<string>('');
  const [inputCategory, setInputCategory] = useState<string>('');
  const [inputTitle, setInputTitle] = useState<string>('');
  const [modalError, setModalError] = useState<string>('');

  // Extract unique categories across loaded mappings for native datalist auto-suggest
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    Object.values(data).forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Filtered vendor list based strictly on search query
  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return Object.entries(data)
      .filter(([vendor, mapping]) => {
        if (!query) return true;
        return (
          vendor.toLowerCase().includes(query) ||
          mapping.category.toLowerCase().includes(query) ||
          mapping.title.toLowerCase().includes(query)
        );
      })
      .sort(([a], [b]) => a.localeCompare(b));
  }, [data, search]);

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

        const normalized: CategoryMapperData = {};
        Object.entries(parsed).forEach(([key, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            normalized[key.trim()] = {
              category: String(val.category || 'General').trim(),
              title: String(val.title || key).trim(),
            };
          }
        });

        fileHandleRef.current = handle;
        setHasFileHandle(true);
        setFileName(file.name);
        setData(normalized);
        setIsFileLoaded(true);
        setIsDirty(false);
        showToast(`Loaded ${Object.keys(normalized).length} mappings from ${file.name}!`, 'success');
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

      const normalized: CategoryMapperData = {};
      Object.entries(parsed).forEach(([key, val]: [string, any]) => {
        if (val && typeof val === 'object') {
          normalized[key.trim()] = {
            category: String(val.category || 'General').trim(),
            title: String(val.title || key).trim(),
          };
        }
      });

      setFileName(file.name);
      setData(normalized);
      setIsFileLoaded(true);
      setHasFileHandle(false);
      setIsDirty(false);
      showToast(`Loaded ${Object.keys(normalized).length} mappings from ${file.name}!`, 'success');
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

  // Close active file
  const handleCloseFile = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Close file without saving?')) {
      return;
    }
    setData({});
    setIsFileLoaded(false);
    setFileName('category_mapper.json');
    setHasFileHandle(false);
    setIsDirty(false);
    fileHandleRef.current = null;
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

    // Universal Fallback: Download file
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

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingVendorKey(null);
    setInputVendor('');
    setInputCategory(uniqueCategories[0] || 'Food & Dining');
    setInputTitle('');
    setModalError('');
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (vendorKey: string, mapping: VendorMapping) => {
    setEditingVendorKey(vendorKey);
    setInputVendor(vendorKey);
    setInputCategory(mapping.category);
    setInputTitle(mapping.title);
    setModalError('');
    setShowModal(true);
  };

  // Save Add/Edit
  const handleSaveModal = () => {
    const vendor = inputVendor.trim();
    const category = inputCategory.trim();
    const title = inputTitle.trim();

    if (!vendor) {
      setModalError('Vendor name is required.');
      return;
    }
    if (!category) {
      setModalError('Category is required.');
      return;
    }
    if (!title) {
      setModalError('Title is required.');
      return;
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
      if (editingVendorKey && editingVendorKey !== vendor) {
        delete next[editingVendorKey];
      }
      next[vendor] = { category, title };
      return next;
    });

    setIsDirty(true);
    setShowModal(false);
    showToast(editingVendorKey ? `Updated ${vendor}` : `Added ${vendor}`, 'success');
  };

  // Delete vendor mapping
  const handleDelete = (vendorKey: string) => {
    if (window.confirm(`Delete entry for "${vendorKey}"?`)) {
      setData((prev) => {
        const next = { ...prev };
        delete next[vendorKey];
        return next;
      });
      setIsDirty(true);
      showToast(`Removed ${vendorKey}`, 'success');
    }
  };

  const totalCount = Object.keys(data).length;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-200 text-slate-100 font-sans">
      {/* Hidden File Input for non-FSA browsers */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFallbackFileSelect}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5 min-w-0">
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
              Automate notification vendor to category dictionary
            </p>
          </div>
        </div>
      </div>

      {/* STATE 1: NO FILE OPENED (Clean Empty State) */}
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
              Open your Automate notification mapping file to view and manage vendor categories.
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
        /* STATE 2: FILE IS ACTIVE (Standardized Workspace) */
        <>
          {/* Standardized File Status Block */}
          <div
            className={`border rounded-2xl p-4 sm:p-5 shadow-lg transition-all ${
              isDirty
                ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              {/* File Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDirty
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>

              {/* File Name + Inline Save Button + Entry Count */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => {
                      setFileName(e.target.value);
                      setIsDirty(true);
                    }}
                    title="Click to rename file"
                    className="text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition-colors truncate max-w-[200px] sm:max-w-md"
                  />

                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <span className={isDirty ? 'text-amber-400' : 'text-slate-400'}>
                    {isDirty
                      ? `Unsaved changes · ${totalCount} entries`
                      : `Saved · ${totalCount} entries`}
                  </span>
                </div>
              </div>

              <button
                    type="button"
                    onClick={handleSaveFile}
                    className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 ${
                      isDirty
                        ? 'bg-amber-600 hover:bg-amber-500 text-white ring-1 ring-amber-500/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                    Save
              </button>
            </div>
          </div>

          {/* Search Bar & Icon-Only Add Entry Button */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search entries or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-10 text-sm font-bold text-white placeholder:text-slate-500 placeholder:font-medium focus:outline-none focus:border-indigo-500 shadow-inner transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              title="Add Entry"
              className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Bold, Distinct Vendor Mappings Feed */}
          <div className="space-y-3">
            {filteredVendors.map(([vendor, mapping]) => {
              const color = getCategoryColor(mapping.category);
              return (
                <div
                  key={vendor}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-bold text-base text-white truncate">
                          {vendor}
                        </span>
                        <span
                          style={{
                            backgroundColor: `${color}20`,
                            borderColor: `${color}40`,
                            color,
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold shrink-0"
                        >
                          {mapping.category}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-400 truncate font-medium">
                        {mapping.title}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 -mr-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(vendor, mapping)}
                        title="Edit entry"
                        className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(vendor)}
                        title="Delete entry"
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredVendors.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 shadow-md">
                <FileCode2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300">
                  {totalCount === 0 ? 'No entries in this file' : 'No matching entries found'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  {totalCount === 0
                    ? 'Click "+ Add Entry" above to add your first notification mapping.'
                    : `No entry matches "${search}".`}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Standard Form Modal: Add / Edit Entry */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 w-full max-w-lg shadow-2xl text-slate-100 space-y-5 my-auto">
            {/* Modal Header without AI Icon */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="font-bold text-lg text-white">
                {editingVendorKey ? 'Edit Mapping Entry' : 'New Mapping Entry'}
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
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                Vendor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Uber, Amazon"
                value={inputVendor}
                onChange={(e) => {
                  setInputVendor(e.target.value);
                  setModalError('');
                }}
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Field 2: Category (with native datalist auto-suggest) */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
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
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <datalist id="category-suggestions">
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Field 3: Transaction Title */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
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
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Standard Modal Buttons: Cancel on Left, Save/Add on Right */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-12 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="h-12 px-7 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
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
