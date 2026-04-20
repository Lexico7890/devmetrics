"use client";

import React, { useEffect, useState } from 'react';
import { 
  GitMerge, 
  Clock, 
  MessageSquare, 
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = "/api";

const PRAnalytics: React.FC = () => {
  const { accessToken } = useAuth();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [days, setDays] = useState<number>(30);
  const [summary, setSummary] = useState<any>(null);
  const [recentPRs, setRecentPRs] = useState<any>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch(`${API_URL}/analytics/repositories`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRepositories(data);
        }
      } catch (err) {
        console.error('Error fetching repositories:', err);
      }
    };
    fetchRepos();
  }, [accessToken]);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedRepo) queryParams.append('repositoryId', selectedRepo);
        queryParams.append('days', days.toString());

        const [summaryRes, prsRes] = await Promise.all([
          fetch(`${API_URL}/analytics/prs/summary?${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          fetch(`${API_URL}/analytics/pull-requests?limit=5&${queryParams.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);

        if (summaryRes.ok) setSummary(await summaryRes.json());
        if (prsRes.ok) {
          const prData = await prsRes.json();
          setRecentPRs(prData.items);
        }
      } catch (err) {
        console.error('Error fetching PR analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accessToken, selectedRepo, days]);

  if (isLoading && !summary) {
    return <div className="text-white p-8 animate-pulse text-sm font-medium">Loading pull request intelligence...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Pull Request Analytics</h1>
          <p className="text-sm text-slate-500 mt-1.5">Tracking velocity, quality and collaboration metrics across engineering teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-card-dark border border-border-dark rounded-lg px-4 py-2 text-xs font-medium text-slate-300 focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:border-slate-600 transition-colors"
          >
            <option value="">All Repositories</option>
            {repositories.map(repo => (
              <option key={repo.id} value={repo.id}>{repo.name}</option>
            ))}
          </select>
          <div className="bg-card-dark border border-border-dark rounded-lg p-1 flex">
            {[30, 90].map(d => (
              <button 
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${
                  days === d ? 'bg-primary/20 text-primary shadow-sm' : 'text-slate-500 hover:text-white'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PRStatCard 
              icon={<Clock className="w-5 h-5 text-blue-500" />} 
              label="Velocity (Avg Merge)" 
              value={summary.velocity.value} 
              change={summary.velocity.change} 
              trend={summary.velocity.trend} 
              subtext={`total: ${summary.mergedPrs} merged`} 
              color="blue"
            />
            <PRStatCard 
              icon={<GitMerge className="w-5 h-5 text-emerald-500" />} 
              label="PR Success Rate" 
              value={summary.successRate.value} 
              change={summary.successRate.change} 
              trend={summary.successRate.trend} 
              subtext={`total: ${summary.totalPrs} closed`} 
              color="emerald"
            />
            <PRStatCard 
              icon={<MessageSquare className="w-5 h-5 text-amber-500" />} 
              label="Review Participation" 
              value={summary.participation.value} 
              change={summary.participation.change} 
              trend={summary.participation.trend} 
              subtext="based on comments" 
              color="amber"
            />
          </div>

          <div className="bg-card-dark border border-border-dark p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-lg text-white">PR Size Distribution</h3>
                <p className="text-slate-500 text-xs mt-1">Breakdown of code complexity by line count</p>
              </div>
              <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {summary.distribution.map((d: any) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative h-14 w-full bg-black/40 rounded-xl flex overflow-hidden p-1 gap-1 border border-border-dark">
              {summary.distribution.map((d: any, idx: number) => {
                const percentage = summary.totalPrs > 0 ? (d.value / summary.totalPrs) * 100 : 0;
                return (
                  <div 
                    key={d.name}
                    className={`h-full opacity-80 hover:opacity-100 transition-all cursor-help ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : ''}`}
                    style={{ 
                      width: `${Math.max(percentage, 2)}%`, 
                      backgroundColor: d.color 
                    }} 
                    title={`${Math.round(percentage)}% ${d.name} PRs (${d.value})`} 
                  />
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 mt-6">
              {summary.distribution.map((d: any, idx: number) => (
                <div key={d.name} className={`text-center ${idx < 2 ? 'border-r border-border-dark' : ''} px-4`}>
                  <p className="text-2xl font-bold text-white">{d.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{d.name} PRs</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
                placeholder="Filter title..." 
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
              {recentPRs.map((pr: any) => (
                <PRRow 
                  key={pr.githubId}
                  title={pr.title} 
                  refNo={pr.id} 
                  time={pr.time} 
                  author={pr.author} 
                  authorImg={pr.authorImg} 
                  status={pr.status} 
                  velocity={pr.mergeTime}
                  additions={pr.additions} 
                  deletions={pr.deletions} 
                />
              ))}
              {recentPRs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic text-sm">No recent activity found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PRStatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; change: string; trend: 'up' | 'down'; subtext: string; color: string }> = ({
  icon, label, value, change, trend, subtext, color
}) => {
  const isPositive = trend === 'up';
  
  return (
    <div className="bg-card-dark border border-border-dark p-6 rounded-2xl hover:border-primary/40 transition-all group shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-2.5 bg-${color}-500/10 rounded-xl`}>{icon}</div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border ${
          isPositive 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{label}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{value}</span>
        <span className="text-slate-500 text-[11px] font-medium">{subtext}</span>
      </div>
    </div>
  );
};

const PRRow: React.FC<{ title: string; refNo: string; time: string; author: string; authorImg: string; status: string; velocity?: string; additions: number; deletions: number }> = ({
  title, refNo, time, author, authorImg, status, velocity, additions, deletions
}) => (
  <tr className="hover:bg-white/[0.03] transition-colors group">
    <td className="px-6 py-5">
      <div className="flex flex-col">
        <span className="font-semibold text-sm text-slate-200 group-hover:text-primary transition-colors cursor-pointer line-clamp-1">{title}</span>
        <span className="text-[11px] text-slate-500 mt-0.5">#{refNo} • {time}</span>
      </div>
    </td>
    <td className="px-6 py-5">
      <div className="flex items-center gap-3">
        {authorImg ? (
          <img src={authorImg} alt={author} className="w-8 h-8 rounded-full border border-border-dark shadow-sm" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-border-dark flex items-center justify-center text-[10px] text-white">
            {author.substring(0,2).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-slate-300 font-medium">{author}</span>
      </div>
    </td>
    <td className="px-6 py-5 text-center">
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
        status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
        status === 'Open' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
        'bg-slate-500/10 text-slate-400 border-slate-500/20'
      }`}>
        {status}
      </span>
    </td>
    <td className="px-6 py-5 text-sm font-mono text-slate-500">{velocity || '--'}</td>
    <td className="px-6 py-5 text-right">
      <div className="flex items-center justify-end gap-2 text-xs font-mono font-bold">
        <span className="text-emerald-500">+{additions}</span>
        <span className="text-rose-500">-{deletions}</span>
      </div>
    </td>
  </tr>
);

export default PRAnalytics;

