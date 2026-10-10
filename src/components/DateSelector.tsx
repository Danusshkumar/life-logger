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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 shrink-0">
          <CalendarIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-xs text-slate-200 whitespace-nowrap">Target Date:</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Year Picker Dropdown with Custom Right-Padded Arrow */}
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-indigo-300 font-sans font-semibold text-xs rounded-lg pl-3 pr-7 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23818cf8%22%20stroke-width%3D%222.2%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat"
          >
            {AVAILABLE_YEARS.map((yr) => (
              <option key={yr} value={yr} className="bg-slate-900 text-slate-200 font-sans">
                {yr} Sheet
              </option>
            ))}
          </select>

          {/* Date Input */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-sans text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-slate-800 text-xs">
        <span className="text-slate-400 font-medium">{formatDateDisplay(selectedDate)}</span>
        {selectedDate === getLocalDateString() ? (
          <span className="text-indigo-400 font-semibold bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-0.5 rounded-full text-[11px]">
            Today
          </span>
        ) : (
          <button
            onClick={() => onDateChange(getLocalDateString())}
            className="text-indigo-400 hover:text-indigo-300 font-medium underline text-[11px] transition-colors"
          >
            Switch to Today
          </button>
        )}
      </div>
    </div>
  );
};
