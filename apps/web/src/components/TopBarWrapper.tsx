"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TopBarWrapper: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumb = () => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/analytics') return 'PR Analytics';
    if (pathname === '/repositories') return 'Repositories';
    if (pathname === '/onboarding') return 'Setup';
    if (pathname === '/settings') return 'Settings';
    if (pathname.startsWith('/repositories/')) return 'Repository Detail';
    if (pathname === '/pr-list') return 'Pull Requests';
    return 'Overview';
  };

  return (
    <header className="h-16 border-b border-border-dark bg-background-dark/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
        <Link href="/" className="text-slate-500 cursor-pointer hover:text-white">DevMetrics</Link>
        <ChevronRight className="w-3 h-3 text-slate-700" />
        <span className="text-white">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search projects or PRs..."
            className="bg-card-dark border border-border-dark rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary w-64 transition-all outline-none"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border-2 border-background-dark"></span>
          </button>
          <div className="w-px h-6 bg-border-dark mx-2" />
          
          <div className="relative" ref={popoverRef}>
            <button 
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-white/5 transition-all outline-none"
            >
              <img
                src={user?.avatarUrl ?? "https://picsum.photos/seed/user/100/100"}
                className="w-7 h-7 rounded-full border border-primary/20 object-cover"
                referrerPolicy="no-referrer"
                alt="User"
              />
              <span className="text-xs font-bold text-slate-300">{user?.name ?? user?.login ?? "User"}</span>
            </button>

            {isPopoverOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card-dark border border-border-dark py-1 z-50">
                <button
                  onClick={() => {
                    setIsPopoverOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBarWrapper;
