/* eslint-disable react-hooks/purity */

"use client";

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Sparkles,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
// import { getAIPerformanceSummary } from '../services/modelServise';

const timelineData = [
  { name: 'Oct 01', main: 400, development: 240 },
  { name: 'Oct 07', main: 300, development: 139 },
  { name: 'Oct 14', main: 900, development: 980 },
  { name: 'Oct 21', main: 200, development: 390 },
  { name: 'Oct 28', main: 1100, development: 480 },
  { name: 'Nov 01', main: 500, development: 380 },
];

const languageData = [
  { name: 'TypeScript', value: 75, color: '#3b82f6' },
  { name: 'Rust', value: 15, color: '#6366f1' },
  { name: 'Go', value: 10, color: '#a855f7' },
];

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('Analyzing repository trends...');

  /*useEffect(() => {
    const fetchInsight = async () => {
      const stats = {
        totalCommits: 1240,
        activeDays: 28,
        mainLanguages: ['TypeScript', 'Rust'],
        trend: 'positive'
      };
      const summary = await getAIPerformanceSummary(stats);
      setAiInsight(summary || 'Insight unavailable.');
    };
    fetchInsight();
  }, []);*/

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Aggregated insights from your GitHub activity</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card-dark border border-border-dark rounded-lg p-1 flex">
            <button className="px-4 py-1.5 text-xs font-medium bg-primary/20 text-primary rounded-md">Last 30 Days</button>
            <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-white transition-colors">90 Days</button>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* AI Insight Bar */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-center">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">AI Insights</h3>
          <p className="text-sm text-slate-300 italic">{aiInsight}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Commits" value="1,240" change="+12.5%" trend="up" subtext="+140 vs prev period" />
        <KPICard label="PRs Merged" value="86" change="+8.2%" trend="up" subtext="Average 2.1/day" />
        <KPICard label="Lines Changed" value="42.5k" change="-4.1%" trend="down" subtext="Net +12k additions" />
        <KPICard label="Active Days" value="28" change="0%" trend="neutral" subtext="Out of last 30 days" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Commits Timeline</h3>
              <p className="text-xs text-slate-500">Daily code contributions across branches</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Main</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary/30" /> <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Development</span></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161618', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="main" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMain)" strokeWidth={2} />
                <Area type="monotone" dataKey="development" stroke="#3b82f640" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Languages</h3>
          <div className="h-48 flex justify-center items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">12</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Total Lng</span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {languageData.map(lang => (
              <div key={lang.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
                  <span className="text-sm font-medium">{lang.name}</span>
                </div>
                <span className="text-sm font-bold">{lang.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Simulation */}
      <div className="bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Activity Heatmap</h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Less</span>
            <div className="w-3 h-3 bg-primary/10 rounded-sm" />
            <div className="w-3 h-3 bg-primary/30 rounded-sm" />
            <div className="w-3 h-3 bg-primary/60 rounded-sm" />
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-4 custom-scrollbar">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5">
            {Array.from({ length: 364 }).map((_, i) => {
              const opacity = [0.1, 0.3, 0.6, 1][Math.floor(Math.random() * 4)];
              return (
                <div 
                  key={i} 
                  className="w-3 h-3 rounded-sm bg-primary" 
                  style={{ opacity }} 
                  title={`${Math.floor(Math.random() * 10)} commits on this day`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string; change: string; trend: 'up' | 'down' | 'neutral'; subtext: string }> = ({
  label, value, change, trend, subtext
}) => (
  <div className="bg-card-dark border border-border-dark p-5 rounded-xl shadow-sm hover:border-primary/30 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-bold flex items-center gap-0.5 ${
        trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500'
      }`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
        {change}
      </span>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <h3 className="text-3xl font-bold text-white group-hover:text-primary transition-colors">{value}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      </div>
      <div className="w-16 h-8 flex items-end gap-1 pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="w-1.5 bg-primary/20 rounded-t-sm group-hover:bg-primary/40 transition-all" 
            style={{ height: `${Math.random() * 100}%` }} 
          />
        ))}
      </div>
    </div>
  </div>
);

export default Dashboard;
