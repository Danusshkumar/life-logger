import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  selectedYear: string; // e.g. "2026"
  onDateChange: (date: string) => void;
  onYearChange: (year: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  selectedYear,
  onDateChange,
  onYearChange,
}) => {
  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const AVAILABLE_YEARS = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-xs text-slate-300">Target Date:</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Year Picker Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-indigo-300 font-mono font-bold text-xs rounded-xl px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {AVAILABLE_YEARS.map((yr) => (
              <option key={yr} value={yr} className="bg-slate-900 text-slate-200">
                {yr} Sheet
              </option>
            ))}
          </select>

          {/* Date Input */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
        <span className="text-slate-400 font-medium">{formatDateDisplay(selectedDate)}</span>
        {selectedDate === getLocalDateString() ? (
          <span className="text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded-full text-[10px]">
            Today
          </span>
        ) : (
          <button
            onClick={() => onDateChange(getLocalDateString())}
            className="text-slate-400 hover:text-white underline text-[10px]"
          >
            Switch to Today
          </button>
        )}
      </div>
    </div>
  );
};
