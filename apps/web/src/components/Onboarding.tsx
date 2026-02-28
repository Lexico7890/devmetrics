
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  Bolt, 
  CheckCircle, 
  ArrowRight,
  Loader2
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);

  useEffect(() => {
    const logPool = [
      { msg: 'AUTH: Success connected to API endpoint', type: 'success' },
      { msg: 'SESSION: Authorized as @dev_user', type: 'info' },
      { msg: 'INDEX: Fetching branches for facebook/react', type: 'info' },
      { msg: 'TASK: Fetching commits (Batch #42)', type: 'working' },
      { msg: 'ANALYTICS: Computing impact metrics...', type: 'info' },
    ];

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          return 100;
        }
        return p + 0.5;
      });
      
      if (Math.random() > 0.7) {
        const log = logPool[Math.floor(Math.random() * logPool.length)];
        setLogs(prev => [...prev.slice(-10), { time: new Date().toLocaleTimeString([], {hour12:false}), ...log }]);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-700">
      <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Select Repositories</h1>
            <p className="text-sm text-slate-400">Index your project history to start generating metrics.</p>
          </div>
          <button className="text-xs font-semibold text-primary">Select All</button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            className="w-full bg-[#0d1117] border border-border-dark rounded-lg py-2.5 pl-11 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none" 
            placeholder="Search your GitHub repositories..." 
          />
        </div>

        <div className="flex-1 bg-[#0d1117] border border-border-dark rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="bg-white/5 px-4 py-2 border-b border-border-dark text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Repository Selection
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
            <OnboardingRepoRow name="facebook/react" stars="214k" lang="TypeScript" langColor="#3178c6" selected />
            <OnboardingRepoRow name="vercel/next.js" stars="112k" lang="TypeScript" langColor="#3178c6" selected />
            <OnboardingRepoRow name="tailwindlabs/tailwindcss" stars="72k" lang="CSS" langColor="#38bdf8" />
            <OnboardingRepoRow name="internal-org/core-api" lang="Go" langColor="#00add8" isPrivate />
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark p-4 rounded-xl flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="font-bold text-lg">2</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Repositories selected</p>
              <p className="text-[11px] text-slate-500 font-medium">System will analyze ~12.4k commits</p>
            </div>
          </div>
          <button 
            onClick={onComplete}
            className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            Initialize Data Sync <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <aside className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-gradient-to-b from-[#0d1117] to-[#161b22] border border-border-dark rounded-xl p-6 flex-1 flex flex-col shadow-lg">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Data Ingestion Engine</h2>
              <p className="text-xs text-slate-500">Processing real-time stream from webhooks.</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              ACTIVE
            </div>
          </div>

          <div className="space-y-5 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Progress</p>
                <p className="text-4xl font-black text-white tracking-tighter">{progress.toFixed(1)}<span className="text-lg text-slate-600">%</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Estimated Time</p>
                <p className="text-sm font-bold text-primary">2m 14s</p>
              </div>
            </div>
            <div className="h-2 w-full bg-[#30363d] rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary relative transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.4)]" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[pulse_2s_infinite]" />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-black/40 rounded-lg p-4 border border-border-dark flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-dark/50">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">System Activity</span>
              </div>
              <span className="text-[10px] text-slate-600 font-mono">v4.2.0-core</span>
            </div>
            <div className="flex-1 space-y-2 font-mono text-[11px] custom-scrollbar overflow-y-auto max-h-[200px]">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-slate-800 shrink-0">{log.time}</span>
                  <span className={`${
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'working' ? 'text-white' : 'text-slate-400'
                  } flex items-center gap-1.5`}>
                    {log.type === 'working' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 relative overflow-hidden group">
          <div className="relative z-10 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Bolt className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Optimization available</h3>
              <p className="text-xs text-slate-400 mb-3 leading-normal">Large repository detected. Select specific branches to reduce sync time by 60%.</p>
              <button className="text-xs font-bold text-primary hover:text-white transition-colors">Configure branches →</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

const OnboardingRepoRow: React.FC<{ name: string; stars?: string; lang: string; langColor: string; selected?: boolean; isPrivate?: boolean }> = ({
  name, stars, lang, langColor, selected, isPrivate
}) => (
  <div className={`p-4 flex items-center justify-between group transition-colors ${selected ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]'}`}>
    <div className="flex items-center gap-4">
      <input type="checkbox" defaultChecked={selected} className="w-4 h-4 rounded border-border-dark bg-transparent text-primary focus:ring-0 cursor-pointer" />
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold transition-colors ${selected ? 'text-white' : 'text-slate-400'}`}>{name}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            isPrivate ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-800 text-slate-500 border-border-dark'
          }`}>
            {isPrivate ? 'Private' : 'Public'}
          </span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} /> {lang}</span>
          {stars && <span className="flex items-center gap-1">★ {stars}</span>}
        </div>
      </div>
    </div>
    {selected && <CheckCircle className="w-4 h-4 text-primary" />}
  </div>
);

export default Onboarding;
