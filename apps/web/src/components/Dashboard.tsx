/* eslint-disable react-hooks/purity */

"use client";

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Sparkles,
  Trophy,
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

const API_URL = "/api"

const Dashboard: React.FC = () => {
  const [aiInsight, setAiInsight] = useState<string>('Analyzing repository trends...');
  const { accessToken } = useAuth();

  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = React.useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [accessToken, refreshKey]);

  useEffect(() => {
    if (!accessToken) return;

    const checkSyncStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/analytics/sync-status`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIsSyncing(data.isSyncing);

          if (isSyncingRef.current && !data.isSyncing) {
            setRefreshKey(prev => prev + 1);
          }
          isSyncingRef.current = data.isSyncing;
        }
      } catch (err) {
        console.error('Error fetching sync status:', err);
      }
    };

    checkSyncStatus();
    const intervalId = setInterval(checkSyncStatus, 5000);
    return () => clearInterval(intervalId);
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

      {/* ESTO ES NUEVO: Si 'isSyncing' es verdadero, pintamos una alerta súper 
          llamativa para que el usuario sepa por qué sus números están en cero o bajos. */}
      {isSyncing && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-0.5">Sync in progress</h3>
            <p className="text-sm text-slate-300">We are securely downloading your GitHub history in the background. Metrics will update automatically upon completion.</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Total Commits" value={stats.totalCommits.value} change={stats.totalCommits.change} trend={stats.totalCommits.trend} subtext={stats.totalCommits.subtext} personalBest={stats.totalCommits.personalBest} />
        <KPICard label="PRs Activity" value={stats.prsActivity.value} change={stats.prsActivity.change} trend={stats.prsActivity.trend} subtext={stats.prsActivity.subtext} personalBest={stats.prsActivity.personalBest} />
        <KPICard label="Lines Changed" value={stats.linesChanged.value} change={stats.linesChanged.change} trend={stats.linesChanged.trend} subtext={stats.linesChanged.subtext} personalBest={stats.linesChanged.personalBest} />
        <KPICard label="Active Days" value={stats.activeDays.value} change={stats.activeDays.change} trend={stats.activeDays.trend} subtext={stats.activeDays.subtext} personalBest={stats.activeDays.personalBest} />
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
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary" /> <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Commits</span></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161618', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="commits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMain)" strokeWidth={2} />
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

      {/* Heatmap Real Data */}
      <div className="bg-card-dark border border-border-dark rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Activity Heatmap</h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>Less</span>
            <div className="w-3 h-3 bg-slate-800/50 rounded-sm" />
            <div className="w-3 h-3 bg-primary/40 rounded-sm" />
            <div className="w-3 h-3 bg-primary/70 rounded-sm" />
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span>More</span>
          </div>
        </div>

        {(() => {
          if (!overviewData.heatmap || overviewData.heatmap.length === 0) return null;

          const weeks: any[][] = [];
          for (let i = 0; i < overviewData.heatmap.length; i += 7) {
            weeks.push(overviewData.heatmap.slice(i, i + 7));
          }

          const monthLabels: { label: string, weekIndex: number }[] = [];

          weeks.forEach((week, weekIndex) => {
            const [y, m, d] = week[0].date.split('-');
            const firstDay = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            const month = firstDay.getMonth();

            let isNewMonth = false;
            if (weekIndex === 0) {
              isNewMonth = true;
            } else {
              const [py, pm, pd] = weeks[weekIndex - 1][0].date.split('-');
              const prevFirstDay = new Date(parseInt(py), parseInt(pm) - 1, parseInt(pd));
              isNewMonth = month !== prevFirstDay.getMonth();
            }

            if (isNewMonth) {
              monthLabels.push({
                label: firstDay.toLocaleString('en-US', { month: 'short' }),
                weekIndex
              });
            }
          });

          const cleanMonthLabels = [];
          for (let i = 0; i < monthLabels.length; i++) {
            if (i < monthLabels.length - 1 && (monthLabels[i + 1].weekIndex - monthLabels[i].weekIndex) < 3) {
              continue;
            }
            cleanMonthLabels.push(monthLabels[i]);
          }

          return (
            <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-max relative pt-6">

                {/* Labels de los Meses */}
                <div className="absolute top-0 left-0 flex text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {cleanMonthLabels.map(({ label, weekIndex }) => (
                    <span
                      key={`${label}-${weekIndex}`}
                      className="absolute"
                      style={{ left: `${weekIndex * 18}px` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Grilla de Contribuciones */}
                <div className="grid grid-rows-7 grid-flow-col gap-[6px]">
                  {overviewData.heatmap.map((day: any) => {
                    let rectClass = "w-3 h-3 rounded-[2px] transition-colors hover:border hover:border-white/50 ";
                    if (day.count === 0) {
                      rectClass += "bg-slate-800/40";
                    } else if (day.count < 3) {
                      rectClass += "bg-primary/40";
                    } else if (day.count < 6) {
                      rectClass += "bg-primary/70";
                    } else {
                      rectClass += "bg-primary";
                    }

                    return (
                      <div
                        key={day.date}
                        className={rectClass}
                        title={`${day.count} commits on ${day.date}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

const KPICard: React.FC<{ label: string; value: string | number; change: string; trend: 'up' | 'down' | 'neutral'; subtext: string; personalBest?: number }> = ({
  label, value, change, trend, subtext, personalBest
}) => {
  const formatPb = (pb: number) => pb >= 1000 ? `${(pb / 1000).toFixed(1)}k` : pb.toString();

  return (
    <div className="bg-card-dark border border-border-dark p-5 rounded-xl shadow-sm hover:border-primary/30 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`text-xs font-bold flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-500'
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
        <div className="flex flex-col items-end gap-2">
          {personalBest !== undefined && personalBest > 0 && (
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-500/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md" title="All-time 30-day Personal Best">
              <Trophy className="w-3 h-3" /> PB: {formatPb(personalBest)}
            </div>
          )}
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
    </div>
  );
};

export default Dashboard;
