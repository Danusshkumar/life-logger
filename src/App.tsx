import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Life Logger PWA
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Personal Daily Log & Activity Tracker synced with Google Sheets
        </p>
        
        <div className="my-6 p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-left text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span>Scaffolding Status:</span>
            <span className="text-emerald-400 font-semibold">Ready</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Stack:</span>
            <span className="text-indigo-400">React + TS + Vite + Tailwind</span>
          </div>
        </div>

        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-md transition-all"
        >
          Test Counter: {count}
        </button>
      </div>
    </div>
  )
}
