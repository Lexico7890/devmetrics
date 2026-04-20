
"use client";

import React from 'react';
import { 
  GitMerge, 
  Clock, 
  Target, 
  MessageSquare, 
  Filter,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const PRAnalytics: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pull Request Analytics</h1>
          <p className="text-sm text-slate-500 mt-1.5">Tracking velocity, quality and collaboration metrics across engineering teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-card-dark border border-border-dark rounded-lg px-4 py-2 text-xs font-medium text-slate-300 focus:ring-1 focus:ring-primary outline-none cursor-pointer">
            <option>All Repositories</option>
            <option>frontend-core</option>
            <option>backend-api</option>
          </select>
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-all">
            Last 30 Days
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PRStatCard 
          icon={<Clock className="w-5 h-5 text-blue-500" />} 
          label="Average Time to Merge" 
          value="18.4h" 
          change="-12.5%" 
          subtext="median: 14.2h" 
          color="blue"
        />
        <PRStatCard 
          icon={<GitMerge className="w-5 h-5 text-emerald-500" />} 
          label="PR Success Rate" 
          value="94.2%" 
          change="+2.1%" 
          subtext="goal: 90%" 
          color="emerald"
        />
        <PRStatCard 
          icon={<MessageSquare className="w-5 h-5 text-amber-500" />} 
          label="Review Participation" 
          value="88.0%" 
          change="-4.3%" 
          subtext="avg 2.4 rev/PR" 
          color="amber"
        />
      </div>
      <div className="bg-card-dark border border-border-dark p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-lg text-white">PR Size Distribution</h3>
            <p className="text-slate-500 text-xs mt-1">Breakdown of code complexity by line count</p>
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Small</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Medium</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Large</div>
          </div>
        </div>
        <div className="relative h-14 w-full bg-black/40 rounded-xl flex overflow-hidden p-1 gap-1 border border-border-dark">
          <div className="h-full bg-emerald-500/80 hover:bg-emerald-500 transition-all rounded-l-lg cursor-help" style={{ width: '45%' }} title="45% Small PRs" />
          <div className="h-full bg-blue-500/80 hover:bg-blue-500 transition-all cursor-help" style={{ width: '35%' }} title="35% Medium PRs" />
          <div className="h-full bg-amber-500/80 hover:bg-amber-500 transition-all rounded-r-lg cursor-help" style={{ width: '20%' }} title="20% Large PRs" />
        </div>
        <div className="grid grid-cols-3 mt-6">
          <div className="text-left border-r border-border-dark pr-4">
            <p className="text-2xl font-bold text-white">142</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Small PRs</p>
          </div>
          <div className="text-center border-r border-border-dark px-4">
            <p className="text-2xl font-bold text-white">112</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Medium PRs</p>
          </div>
          <div className="text-right pl-4">
            <p className="text-2xl font-bold text-white">64</p>
            <p className="text-xs text-slate-500 uppercase font-semibold">Large PRs</p>
          </div>
        </div>
      </div>
      <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-border-dark flex items-center justify-between bg-white/[0.02]">
          <div>
            <h3 className="font-bold text-lg text-white">Recent Activity</h3>
            <p className="text-slate-500 text-xs mt-0.5">Real-time status of latest submissions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Filter className="absolute left-3 top-2 w-4 h-4 text-slate-500" />
              <input 
                className="bg-black/40 border border-border-dark rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary w-48" 
                placeholder="Filter status..." 
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-widest bg-black/20">
                <th className="px-6 py-4">Title & Reference</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Velocity</th>
                <th className="px-6 py-4 text-right">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              <PRRow title="feat: implement dark mode context provider" refNo="2451" time="2h ago" author="sconnor" authorImg="https://picsum.photos/seed/scon/50/50" status="Open" additions={42} deletions={12} />
              <PRRow title="fix: resolver loop in auth middleware" refNo="2448" time="5h ago" author="mwright" authorImg="https://picsum.photos/seed/mwr/50/50" status="Merged" velocity="3.2h" additions={112} deletions={84} />
              <PRRow title="refactor: cleanup legacy logging service" refNo="2445" time="1d ago" author="efisher" authorImg="https://picsum.photos/seed/efi/50/50" status="Merged" velocity="18.1h" additions={8} deletions={1240} />
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border-dark bg-black/20 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing <span className="text-white">1-3</span> of 318</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-zinc-900 border border-border-dark rounded text-[11px] font-bold text-slate-500">Prev</button>
            <button className="px-3 py-1.5 bg-zinc-800 border border-border-dark rounded text-[11px] font-bold text-white hover:bg-zinc-700 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PRStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; change: string; subtext: string; color: string }> = ({
  icon, label, value, change, subtext, color
}) => (
  <div className="bg-card-dark border border-border-dark p-6 rounded-2xl hover:border-primary/40 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-2.5 bg-${color}-500/10 rounded-xl`}>{icon}</div>
      {/* Fixed: Added TrendingUp which was missing in imports */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
        <TrendingUp className="w-3 h-3" /> {change}
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
      <span className="text-slate-500 text-xs">{subtext}</span>
    </div>
  </div>
);

const PRRow: React.FC<{ title: string; refNo: string; time: string; author: string; authorImg: string; status: string; velocity?: string; additions: number; deletions: number }> = ({
  title, refNo, time, author, authorImg, status, velocity, additions, deletions
}) => (
  <tr className="hover:bg-white/[0.03] transition-colors group">
    <td className="px-6 py-5">
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-slate-200 group-hover:text-primary transition-colors cursor-pointer">{title}</span>
        <span className="text-xs text-slate-500 mt-0.5">#{refNo} • {time}</span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        <img src={authorImg} alt={author} className="w-8 h-8 rounded-full border border-border-dark" />
        <span className="text-sm text-slate-300 font-medium">{author}</span>
      </div>
    </td>
    <td className="px-6 py-5 text-center">
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
        status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      }`}>
        {status}
      </span>
    </td>
    <td className="px-6 py-5 text-sm text-slate-500">{velocity || '--'}</td>
    <td className="px-6 py-5 text-right">
      <div className="flex items-center justify-end gap-2 text-xs font-mono font-bold">
        <span className="text-emerald-500">+{additions}</span>
        <span className="text-rose-500">-{deletions}</span>
      </div>
    </td>
  </tr>
);

export default PRAnalytics;
