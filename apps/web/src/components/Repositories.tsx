
"use client";

import React from 'react';
import { 
  RefreshCcw, 
  Book, 
  Lock, 
  Settings, 
  ExternalLink, 
  Plus, 
  AlertTriangle 
} from 'lucide-react';

interface RepositoriesProps {
  onSelectRepo: (id: string) => void;
}

const Repositories: React.FC<RepositoriesProps> = ({ onSelectRepo }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Repositories</h1>
        <p className="text-sm text-slate-400 mt-1">Configure sync parameters for individual projects.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Repositories</h2>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-border-dark hover:border-slate-500 rounded-md transition-all text-xs font-medium text-white">
            <RefreshCcw className="w-4 h-4" />
            Refresh All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RepoCard name="devmetrics-core" type="Public" version="v2.4.0" synced="2m ago" isSyncing onClick={() => onSelectRepo('devmetrics-core')} />
          <RepoCard name="billing-api" type="Private" version="v1.1.2" synced="4h ago" onClick={() => onSelectRepo('billing-api')} />
          
          <button className="border-2 border-dashed border-border-dark rounded-2xl p-8 flex items-center justify-center gap-3 hover:bg-white/[0.02] hover:border-slate-600 transition-all md:col-span-2 group">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="text-base font-bold text-white block">Connect new repository</span>
              <span className="text-xs text-slate-500">Import from organization or personal account</span>
            </div>
          </button>
        </div>
      </section>

      <section className="pt-12 border-t border-border-dark">
        <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Manage Connection
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Modifying your GitHub connection will affect how we fetch data for all linked repositories. Ensure you have the necessary permissions in your organization.
            </p>
          </div>
          <button className="px-6 py-3 bg-transparent text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-500/5">
            Disconnect Account
          </button>
        </div>
      </section>
    </div>
  );
};

const RepoCard: React.FC<{ name: string; type: 'Public' | 'Private'; version: string; synced: string; isSyncing?: boolean; onClick: () => void }> = ({
  name, type, version, synced, isSyncing, onClick
}) => (
  <div 
    onClick={onClick}
    className="bg-card-dark border border-border-dark rounded-2xl p-6 hover:border-primary transition-all group overflow-hidden cursor-pointer shadow-sm relative"
  >
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/5 border border-border-dark rounded-xl flex items-center justify-center">
          {type === 'Public' ? <Book className="w-6 h-6 text-slate-400" /> : <Lock className="w-6 h-6 text-slate-400" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-bold uppercase tracking-widest ${
              type === 'Public' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>{type}</span>
            <span className="text-[10px] text-slate-500 font-mono">{version}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
         <button className="p-2 text-slate-600 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
      </div>
    </div>
    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-dark">
      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
        <RefreshCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
        {isSyncing ? 'Syncing now...' : `Synced ${synced}`}
      </div>
      <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-all" />
    </div>
  </div>
);

export default Repositories;
