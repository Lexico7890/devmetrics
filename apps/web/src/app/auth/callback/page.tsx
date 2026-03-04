"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BarChart3 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAccessToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");

    if (token) {
      setAccessToken(token);
      // Small delay to let the context update, then redirect to dashboard
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } else {
      // No token — go back to login
      router.replace("/auth/login");
    }
  }, [searchParams, setAccessToken, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center animate-pulse">
        <BarChart3 className="text-white w-7 h-7" />
      </div>
      <p className="text-sm text-slate-400">Signing you in...</p>
    </div>
  );
}
