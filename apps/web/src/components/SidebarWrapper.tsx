"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  Rocket,
  List,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SidebarWrapper: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { id: 'pr-list', label: 'All Pull Requests', icon: List, href: '/pr-list' },
    { id: 'pr-analytics', label: 'PR Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'repositories', label: 'Repositories', icon: Database, href: '/repositories' },
    { id: 'onboarding', label: 'Setup', icon: Rocket, href: '/onboarding' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className="w-64 bg-sidebar-dark border-r border-border-dark flex flex-col shrink-0">
      <Link href="/" className="p-6 flex items-center gap-3 cursor-pointer">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <BarChart3 className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">DevMetrics</span>
      </Link>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border-dark mt-auto space-y-4">
        <Link 
          href="/settings"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
            pathname === '/settings'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-slate-500 hover:text-slate-100 hover:bg-white/5'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
        
        <div className="bg-card-dark border border-border-dark rounded-xl p-4">
          <p className="text-xs font-semibold text-white mb-1">Pro Account</p>
          <p className="text-[10px] text-slate-500 mb-3">Syncing 12 active repos</p>
          <button className="w-full py-1.5 bg-white text-black text-xs font-bold rounded-md hover:bg-slate-200 transition-all">
            Upgrade
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 bg-white/5 rounded-xl">
          <img
            src={user?.avatarUrl ?? "https://picsum.photos/seed/user/100/100"}
            alt="User"
            className="w-8 h-8 rounded-full border border-primary/20"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-white">{user?.name ?? user?.login ?? "User"}</p>
            <p className="text-[10px] text-slate-500 truncate">@{user?.login ?? ""}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SidebarWrapper;
