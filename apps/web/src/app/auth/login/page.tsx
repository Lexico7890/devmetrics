"use client";

import { useAuth } from "@/context/AuthContext";
import { BarChart3, Github } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
          <BarChart3 className="text-white w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">DevMetrics</h1>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          Engineering analytics powered by your GitHub data
        </p>
      </div>

      <button
        onClick={login}
        disabled={isLoading}
        className="flex items-center gap-3 px-6 py-3 bg-white text-black font-semibold text-sm rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Github className="w-5 h-5" />
        Sign in with GitHub
      </button>

      <p className="text-[10px] text-slate-600 text-center max-w-xs">
        We only request read access to your repositories, commits, and pull requests.
      </p>
    </div>
  );
}
