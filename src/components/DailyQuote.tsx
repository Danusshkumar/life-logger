import React, { useState } from 'react';
import { Quote, Compass } from 'lucide-react';

const POSITIVE_QUOTES = [
  { text: "Dream is not that which you see while sleeping; it is something that does not let you sleep.", author: "Dr. A.P.J. Abdul Kalam" },
  { text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "If you want to shine like a sun, first burn like a sun.", author: "Dr. A.P.J. Abdul Kalam" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "In a gentle way, you can shake the world.", author: "Mahatma Gandhi" },
  { text: "Take up one idea. Make that one idea your life – think of it, dream of it, live on that idea.", author: "Swami Vivekananda" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

export const DailyQuote: React.FC = () => {
  const [quote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * POSITIVE_QUOTES.length);
    return POSITIVE_QUOTES[randomIndex];
  });

  return (
    <div className="bg-slate-900 border-y border-r border-slate-800 border-l-4 border-l-indigo-500 rounded-2xl p-4 sm:p-5 shadow-xl mb-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">Daily Thought</span>
      </div>

      {/* Quote Body */}
      <div className="flex items-start space-x-3">
        <Quote className="w-5 h-5 text-indigo-400/50 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed italic">
            "{quote.text}"
          </p>
          <span className="text-[11px] font-bold text-indigo-400 block mt-2">
            — {quote.author}
          </span>
        </div>
      </div>
    </div>
  );
};
