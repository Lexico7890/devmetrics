
"use client";

import React from 'react';
import { 
  ChevronLeft, 
  ExternalLink, 
  RefreshCcw, 
  Settings as SettingsIcon,
  Star,
  GitCommit,
  Users,
  Code2,
  Clock,
  ChevronRight,
  Book
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RepositoryDetailProps {
  repoId: string;
  onBack: () => void;
}

const timelineData = [
  { name: '1 Oct', main: 45, dev: 12 },
  { name: '5 Oct', main: 52, dev: 18 },
  { name: '10 Oct', main: 38, dev: 22 },
  { name: '15 Oct', main: 65, dev: 35 },
  { name: '20 Oct', main: 48, dev: 28 },
  { name: '25 Oct', main: 72, dev: 42 },
  { name: '30 Oct', main: 58, dev: 38 },
];

const langData = [
  { name: 'TypeScript', value: 85, color: '#3178c6' },
  { name: 'Go', value: 10, color: '#00add8' },
  { name: 'Others', value: 5, color: '#64748b' },
];

const RepositoryDetail: React.FC<RepositoryDetailProps> = ({ repoId, onBack }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest w-fit"
        >
          <ChevronLeft className="w-4 h-4" /> Back to list
        </button>
        
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
              <Book className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-white tracking-tighter">{repoId}</h1>
                <span className="px-2 py-0.5 rounded-lg border border-border-dark bg-black/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Public</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> TypeScript</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> 12.4k stars</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-dark hover:border-slate-500 rounded-xl transition-all text-xs font-bold text-white">
              <RefreshCcw className="w-4 h-4" /> Sync Now
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 text-xs font-bold hover:bg-primary/90 transition-all">
              <ExternalLink className="w-4 h-4" /> View on GitHub
            </button>
            <button className="p-2.5 bg-card-dark border border-border-dark rounded-xl text-slate-500 hover:text-white transition-all">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DetailStatCard icon={<GitCommit className="w-5 h-5" />} label="Total Commits" value="4,821" trend="+12%" />
        <DetailStatCard icon={<Users className="w-5 h-5" />} label="Contributors" value="42" trend="+3" />
        <DetailStatCard icon={<Code2 className="w-5 h-5" />} label="Lines of Code" value="125k" sub="Net +12k" />
        <DetailStatCard icon={<Clock className="w-5 h-5" />} label="Last Activity" value="2h ago" sub="main branch" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-card-dark border border-border-dark rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-white text-lg">Commit Activity</h3>
                <p className="text-xs text-slate-500 mt-1">Volume of contributions over the last 30 days</p>
              </div>
              <select className="bg-black/40 border border-border-dark rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-400 outline-none uppercase tracking-widest">
                <option>Last 30 Days</option>
                <option>Last 90 Days</option>
              </select>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#161618', border: '1px solid #27272a', borderRadius: '12px' }} />
                  <Area type="monotone" dataKey="main" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMain)" strokeWidth={3} />
                  <Area type="monotone" dataKey="dev" stroke="#3b82f640" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border-dark bg-white/[0.01] flex justify-between items-center">
              <h3 className="font-bold text-white">Recent Commits</h3>
              <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">View History</button>
            </div>
            <div className="divide-y divide-border-dark">
              <CommitRow message="feat: implement adaptive layout for dashboard" author="alex" sha="72a1b94" time="2h ago" adds={42} dels={8} />
              <CommitRow message="fix: resolve memory leak in ingestion service" author="sarah" sha="bc32f1a" time="5h ago" adds={12} dels={124} />
              <CommitRow message="refactor: cleanup legacy state management" author="mike" sha="fe45d3c" time="1d ago" adds={8} dels={12} />
              <CommitRow message="chore: update dependencies" author="bot" sha="e2311ff" time="2d ago" adds={112} dels={0} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card-dark border border-border-dark rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6">Languages</h3>
            <div className="h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {langData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-white">85%</span>
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">TS</span>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {langData.map(lang => (
                <div key={lang.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                    <span className="text-sm font-medium text-slate-300">{lang.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{lang.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-2xl p-6">
            <h3 className="font-bold text-white mb-6">Top Contributors</h3>
            <div className="space-y-4">
              <ContributorItem name="Alex Rivera" commits={142} percent={45} avatar="https://picsum.photos/seed/alex/50/50" />
              <ContributorItem name="Sarah Connor" commits={112} percent={32} avatar="https://picsum.photos/seed/sarah/50/50" />
              <ContributorItem name="Michael Wright" commits={45} percent={12} avatar="https://picsum.photos/seed/mike/50/50" />
            </div>
          </div>

          <div className="bg-card-dark border border-border-dark rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4">Most Changed Files</h3>
            <div className="space-y-3">
              <FileChangeRow name="src/core/router.ts" changes={124} />
              <FileChangeRow name="src/services/api.ts" changes={86} />
              <FileChangeRow name="src/App.tsx" changes={45} />
              <FileChangeRow name="package.json" changes={32} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailStatCard = ({ icon, label, value, trend, sub }: any) => (
  <div className="bg-card-dark border border-border-dark p-6 rounded-2xl shadow-sm hover:border-primary/40 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className="p-2.5 bg-primary/10 rounded-xl text-primary">{icon}</div>
      {trend && (
        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded-lg">
          {trend}
        </span>
      )}
    </div>
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
      {sub && <span className="text-[10px] text-slate-500 font-medium">{sub}</span>}
    </div>
  </div>
);

const CommitRow = ({ message, author, sha, time, adds, dels }: any) => (
  <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] group transition-colors cursor-pointer">
    <div className="flex items-center gap-4">
      <img src={`https://picsum.photos/seed/${author}/50/50`} className="w-8 h-8 rounded-full border border-border-dark" />
      <div>
        <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors line-clamp-1">{message}</p>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
          {sha} • <span className="text-slate-400">{author}</span> • {time}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3 font-mono text-xs font-bold">
      <span className="text-emerald-500">+{adds}</span>
      <span className="text-rose-500">-{dels}</span>
      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 ml-2" />
    </div>
  </div>
);

const ContributorItem = ({ name, commits, percent, avatar }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src={avatar} className="w-8 h-8 rounded-full border border-border-dark" />
        <span className="text-sm font-bold text-slate-200">{name}</span>
      </div>
      <span className="text-xs font-bold text-white">{commits} <span className="text-slate-600 font-medium">commits</span></span>
    </div>
    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  </div>
);

const FileChangeRow = ({ name, changes }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-slate-400 truncate pr-4">{name}</span>
    <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">{changes} mods</span>
  </div>
);

export default RepositoryDetail;
