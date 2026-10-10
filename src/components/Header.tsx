import React from 'react';
import { LogIn, LogOut, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
}

const LifeLoggerLogo: React.FC = () => (
  <svg
    width="38"
    height="38"
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0 rounded-xl"
  >
    <defs>
      {/* Deep Space Badge Background */}
      <linearGradient id="bgGrad" x1="0" y1="52" x2="52" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0B0F19" />
        <stop offset="50%" stopColor="#1E1B4B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      {/* Up-Down-Up Graph Line Gradient */}
      <linearGradient id="upDownLineGrad" x1="6" y1="38" x2="45" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="25%" stopColor="#06B6D4" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="75%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>

      {/* Area Chart Glow Fill Gradient */}
      <linearGradient id="areaFillGrad" x1="26" y1="8" x2="26" y2="44" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
        <stop offset="50%" stopColor="#6366F1" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.0" />
      </linearGradient>

      {/* Apex Star Gradient */}
      <linearGradient id="starGrad" x1="33" y1="2" x2="47" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>

      <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Slate Badge Container Background */}
    <rect width="52" height="52" rx="15" fill="url(#bgGrad)" stroke="#3730A3" strokeWidth="1.2" />

    {/* Horizontal Chart Baseline & Grid */}
    <line x1="6" y1="44" x2="46" y2="44" stroke="#475569" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <line x1="6" y1="32" x2="46" y2="32" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.35" />
    <line x1="6" y1="20" x2="46" y2="20" stroke="#334155" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.35" />

    {/* 3D Area Chart Fill beneath Up-Down-Up Curve */}
    <path
      d="M 6 38 C 11 34, 13 22, 18 22 C 22 22, 24 32, 29 30 C 34 27, 38 12, 45 8 L 45 44 L 6 44 Z"
      fill="url(#areaFillGrad)"
    />

    {/* Vertical Projection Beams dropping from Nodes */}
    <line x1="12" y1="27" x2="12" y2="44" stroke="#06B6D4" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.4" />
    <line x1="18" y1="22" x2="18" y2="44" stroke="#10B981" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.4" />
    <line x1="24" y1="31" x2="24" y2="44" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.4" />
    <line x1="31" y1="25" x2="31" y2="44" stroke="#818CF8" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.4" />
    <line x1="38" y1="15" x2="38" y2="44" stroke="#C084FC" strokeWidth="0.8" strokeDasharray="1 2" opacity="0.4" />

    {/* Up-Down-Up Main Graph Line */}
    <path
      d="M 6 38 C 11 34, 13 22, 18 22 C 22 22, 24 32, 29 30 C 34 27, 38 12, 45 8"
      stroke="url(#upDownLineGrad)"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#glowEffect)"
    />

    {/* 7 Micro Data Point Nodes along the Up-Down-Up Curve */}
    <circle cx="6" cy="38" r="2.2" fill="#10B981" stroke="#064E3B" strokeWidth="0.8" />
    <circle cx="12" cy="27" r="2" fill="#14B8A6" stroke="#042F2E" strokeWidth="0.8" />
    <circle cx="18" cy="22" r="2.4" fill="#06B6D4" stroke="#164E63" strokeWidth="0.8" />
    <circle cx="24" cy="31" r="2.4" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
    <circle cx="31" cy="25" r="2.2" fill="#818CF8" stroke="#312E81" strokeWidth="0.8" />
    <circle cx="38" cy="15" r="2.4" fill="#C084FC" stroke="#581C87" strokeWidth="0.8" />
    <circle cx="45" cy="8" r="2.6" fill="#EC4899" stroke="#831843" strokeWidth="0.8" />

    {/* Apex Star at Summit */}
    <path
      d="M 45 2 L 46.4 6.2 L 50.5 7.5 L 46.4 8.8 L 45 13 L 43.6 8.8 L 39.5 7.5 L 43.6 6.2 Z"
      fill="url(#starGrad)"
      filter="url(#glowEffect)"
    />

    {/* Secondary Sparkle Star */}
    <path
      d="M 13 10 L 13.8 11.8 L 15.5 12.5 L 13.8 13.2 L 13 15 L 12.2 13.2 L 10.5 12.5 L 12.2 11.8 Z"
      fill="#A7F3D0"
      opacity="0.85"
    />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  onLogin,
  onLogout,
  onRefresh,
  isSyncing,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 shadow-lg flex items-center">
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        {/* App Title & Subtitle */}
        <div className="flex items-center space-x-2.5">
          <LifeLoggerLogo />
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">
              Life Logger
            </h1>
            <p className="text-[11px] text-slate-400 font-medium -mt-0.5">Sheets Synced PWA</p>
          </div>
        </div>

        {/* Top Right Action Buttons (Sleek Minimal Icon Buttons) */}
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Refresh sheet data"
              className="p-2.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>
          ) : (
            <button
              onClick={onLogin}
              title="Google Login"
              className="p-2.5 bg-indigo-600/90 hover:bg-indigo-600 border border-indigo-500/50 text-white rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
