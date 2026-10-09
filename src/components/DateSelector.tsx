import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const isToday = selectedDate === getTodayString();
  const isYesterday = selectedDate === getYesterdayString();

  const handleStepDay = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleStepDay(-1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="bg-transparent font-semibold text-base text-white focus:outline-none cursor-pointer"
            />
          </div>
          <span className="text-xs text-slate-400 mt-0.5">{formatDateDisplay(selectedDate)}</span>
        </div>

        <button
          onClick={() => handleStepDay(1)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Access Pills */}
      <div className="flex justify-center items-center space-x-2 mt-3 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onDateChange(getTodayString())}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
            isToday
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => onDateChange(getYesterdayString())}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
            isYesterday
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Yesterday
        </button>
        {!isToday && !isYesterday && (
          <button
            onClick={() => onDateChange(getTodayString())}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-all"
            title="Reset to Today"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
