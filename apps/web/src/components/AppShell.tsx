"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SidebarWrapper from "@/components/SidebarWrapper";
import TopBarWrapper from "@/components/TopBarWrapper";
import { BarChart3 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  const isAuthRoute = pathname.startsWith("/auth");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark text-slate-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center animate-pulse">
            <BarChart3 className="text-white w-7 h-7" />
          </div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages (login, callback) — no sidebar/topbar
  if (isAuthRoute) {
    return (
      <div className="h-screen bg-background-dark text-slate-300">
        {children}
      </div>
    );
  }

  // Not authenticated and not on an auth route — the AuthContext will redirect
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated — full app layout
  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-300">
      <SidebarWrapper />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBarWrapper />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
