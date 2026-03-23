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
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/api";

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('Analyzing repository trends...');
  const { accessToken } = useAuth();
  
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${API_URL}/analytics/dashboard/overview`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOverviewData(data);
          setAiInsight(`Your repository activity shows a ${data.stats.totalCommits.trend} trend.`);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, [accessToken]);

  if (isLoading) {
    return <div className="text-white p-8">Loading dashboard metrics...</div>;
  }

  if (!overviewData) {
    return <div className="text-white p-8">No data available yet. Please complete a sync.</div>;
  }

  const { stats, timeline, languages } = overviewData;

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
        <KPICard label="Total Commits" value={stats.totalCommits.value} change={stats.totalCommits.change} trend={stats.totalCommits.trend} subtext={stats.totalCommits.subtext} />
        <KPICard label="PRs Merged" value={stats.prsMerged.value} change={stats.prsMerged.change} trend={stats.prsMerged.trend} subtext={stats.prsMerged.subtext} />
        <KPICard label="Lines Changed" value={stats.linesChanged.value} change={stats.linesChanged.change} trend={stats.linesChanged.trend} subtext={stats.linesChanged.subtext} />
        <KPICard label="Active Days" value={stats.activeDays.value} change={stats.activeDays.change} trend={stats.activeDays.trend} subtext={stats.activeDays.subtext} />
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
              <AreaChart data={timeline}>
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
                  data={languages}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {languages.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-white">{languages.length}</span>
              <span className="text-[10px] uppercase text-slate-500 font-bold">Total Lng</span>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {languages.map((lang: any) => (
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
