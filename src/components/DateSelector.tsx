import React, { useRef } from 'react';
import { Calendar, Heart } from 'lucide-react';
import { getLocalDateString } from '../utils/dateUtils';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  userName?: string;
  onDateChange: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  userName,
  onDateChange,
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = selectedDate === getLocalDateString();
  const greetingName = userName && userName.trim().length > 0 ? userName.trim().split(' ')[0] : 'there';

  return (
    <div className="mb-4 space-y-3">
      {/* Top Greeting with Heart Icon After Name (No Icon Before Name) */}
      <div className="px-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center">
          <span>Hi {greetingName}</span>
          <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20 ml-2 shrink-0 inline-block" />
        </h2>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Track your journey, one day at a time
        </p>
      </div>

      {/* Unboxed Seamless Date Row */}
      <div className="flex items-center justify-between px-1 py-1">
        {/* Left: Big Formatted Date Label */}
        <div>
          <span className="font-extrabold text-xl sm:text-2xl text-white tracking-tight block">
            {formatDateDisplay(selectedDate)}
          </span>
        </div>

        {/* Right: Both Today & Calendar Buttons (Active State Highlighted) */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onDateChange(getLocalDateString())}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer active:scale-95 shadow-sm whitespace-nowrap ${
              isToday
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Today
          </button>

          <div className="relative">
            <button
              onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
              title="Choose Custom Date"
              className={`w-9.5 h-9.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm ${
                !isToday
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
