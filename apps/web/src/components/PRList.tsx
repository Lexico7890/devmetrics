
"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  GitPullRequest, 
  Clock, 
  MessageSquare, 
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';

const prs = [
  { id: 2451, title: 'feat: implement adaptive layout for dashboard', repo: 'devmetrics-core', author: 'alex', authorImg: 'https://picsum.photos/seed/alex/50/50', status: 'Open', size: 'M', additions: 42, deletions: 12, time: '2h ago', reviews: 2 },
  { id: 2448, title: 'fix: resolve memory leak in ingestion service', repo: 'devmetrics-core', author: 'sarah', authorImg: 'https://picsum.photos/seed/sarah/50/50', status: 'Merged', size: 'L', additions: 112, deletions: 124, time: '5h ago', mergeTime: '3.2h', reviews: 4 },
  { id: 2445, title: 'refactor: cleanup legacy state management', repo: 'billing-api', author: 'mike', authorImg: 'https://picsum.photos/seed/mike/50/50', status: 'Merged', size: 'S', additions: 8, deletions: 12, time: '1d ago', mergeTime: '18.1h', reviews: 1 },
  { id: 2440, title: 'chore: update stripe-node SDK to v14', repo: 'billing-api', author: 'bot', authorImg: 'https://picsum.photos/seed/bot/50/50', status: 'Closed', size: 'S', additions: 2, deletions: 2, time: '2d ago', reviews: 0 },
  { id: 2432, title: 'docs: update contribution guidelines', repo: 'devmetrics-core', author: 'alex', authorImg: 'https://picsum.photos/seed/alex/50/50', status: 'Merged', size: 'XS', additions: 12, deletions: 0, time: '4d ago', mergeTime: '1.5h', reviews: 2 },
];

const PRList: React.FC = () => {
  const [filter, setFilter] = useState('All');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pull Requests</h1>
          <p className="text-sm text-slate-500 mt-1">Review activity and lifecycle across all repositories.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter by title or #id..." 
              className="bg-card-dark border border-border-dark rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:ring-1 focus:ring-primary outline-none w-64 transition-all" 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-card-dark p-1 rounded-xl border border-border-dark w-fit">
        {['All', 'Open', 'Merged', 'Closed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === s ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-border-dark text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4">Title & Reference</th>
                <th className="px-6 py-4">Repository</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Reviews</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Size</th>
                <th className="px-6 py-4 text-right">Time to Merge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {prs.filter(p => filter === 'All' || p.status === filter).map(pr => (
                <tr key={pr.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded-md ${
                        pr.status === 'Merged' ? 'bg-purple-500/10 text-purple-500' :
                        pr.status === 'Open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        <GitPullRequest className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{pr.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">#{pr.id} • Created {pr.time}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-slate-400 font-mono">{pr.repo}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <img src={pr.authorImg} className="w-6 h-6 rounded-full border border-border-dark" />
                      <span className="text-xs font-bold text-slate-300">{pr.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MessageSquare className="w-3.5 h-3.5" /> {pr.reviews}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      pr.status === 'Merged' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      pr.status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {pr.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${
                      pr.size === 'L' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      pr.size === 'M' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-slate-800 text-slate-500 border border-border-dark'
                    }`}>
                      {pr.size}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {pr.mergeTime ? (
                      <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-300">
                        <Timer className="w-3.5 h-3.5 text-slate-500" /> {pr.mergeTime}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-white/[0.01] border-t border-border-dark flex items-center justify-between text-xs">
          <p className="text-slate-500 font-medium">Showing <span className="text-white font-bold">1-5</span> of 142 pull requests</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border-dark text-slate-500 font-bold hover:text-white transition-colors">Previous</button>
            <button className="px-3 py-1.5 rounded-lg border border-border-dark text-white font-bold bg-white/5 hover:bg-white/10 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRList;
