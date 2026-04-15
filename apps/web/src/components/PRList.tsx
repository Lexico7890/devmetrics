
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  GitPullRequest, 
  Clock,
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface PR {
  id: number;
  githubId: string;
  title: string;
  repo: string;
  author: string;
  authorImg: string | null;
  status: 'Open' | 'Merged' | 'Closed' | 'Draft';
  size: 'XS' | 'S' | 'M' | 'L';
  additions: number;
  deletions: number;
  time: string;
  reviews: number;
  mergeTime: string | null;
  isDraft: boolean;
}

interface PaginationMeta {
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor: string | undefined;
  startCount: number;
  endCount: number;
}

interface PRResponse {
  items: PR[];
  meta: PaginationMeta;
}

const PRList: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [prs, setPrs] = useState<PR[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (cursor) params.set('cursor', cursor);
      if (filter !== 'All') params.set('state', filter);
      
      const response = await fetch(`/api/analytics/pull-requests?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pull requests');
      }
      
      const data: PRResponse = await response.json();
      setPrs(data.items);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  const handlePageChange = (direction: 'next' | 'prev' | 'first') => {
    if (!meta) return;
    
    if (direction === 'first') {
      fetchPRs();
    } else if (direction === 'next' && meta.hasNextPage) {
      fetchPRs(meta.nextCursor);
    } else if (direction === 'prev' && meta.hasPrevPage) {
      fetchPRs();
    }
  };

  const filteredPRs = searchQuery
    ? prs.filter(pr => 
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.id.toString().includes(searchQuery) ||
        pr.repo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prs;

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => fetchPRs()}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          ) : filteredPRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <GitPullRequest className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No pull requests found</p>
            </div>
          ) : (
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
                {filteredPRs.map(pr => (
                  <tr key={pr.githubId} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
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
                          <p className="text-[10px] text-slate-500 mt-0.5">#{pr.id} • {pr.time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-slate-400 font-mono">{pr.repo}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {pr.authorImg ? (
                          <img src={pr.authorImg} alt={pr.author} className="w-6 h-6 rounded-full border border-border-dark" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-border-dark bg-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                            {pr.author[0].toUpperCase()}
                          </div>
                        )}
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
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {pr.mergeTime}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {meta && !loading && !error && (
          <div className="px-6 py-4 bg-white/[0.01] border-t border-border-dark flex items-center justify-between text-xs">
            <p className="text-slate-500 font-medium">
              Showing <span className="text-white font-bold">{meta.startCount}-{meta.endCount}</span> of {meta.total} pull requests
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange('first')}
                disabled={!meta.hasPrevPage}
                className="p-1.5 rounded-lg border border-border-dark text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handlePageChange('prev')}
                disabled={!meta.hasPrevPage}
                className="px-3 py-1.5 rounded-lg border border-border-dark text-slate-500 font-bold hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Previous
              </button>
              <button 
                onClick={() => handlePageChange('next')}
                disabled={!meta.hasNextPage}
                className="px-3 py-1.5 rounded-lg border border-border-dark text-white font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
              <button 
                onClick={() => handlePageChange('next')}
                disabled={!meta.hasNextPage}
                className="p-1.5 rounded-lg border border-border-dark text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PRList;
