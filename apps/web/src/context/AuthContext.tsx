"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  login: string;
  email: string | null;
  avatarUrl: string | null;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://44.198.175.55:4000";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/auth/callback", "/auth/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  const setAccessToken = useCallback((token: string) => {
    setAccessTokenState(token);
    sessionStorage.setItem("access_token", token);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessTokenState(null);
    setUser(null);
    sessionStorage.removeItem("access_token");
  }, []);

  // Fetch user profile with the access token
  const fetchUser = useCallback(
    async (token: string): Promise<User | null> => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    [],
  );

  // Try to refresh the access token using the httpOnly cookie
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.accessToken ?? null;
    } catch {
      return null;
    }
  }, []);

  // On mount: try to restore session
  useEffect(() => {
    const init = async () => {
      // 1. Check sessionStorage first
      let token = sessionStorage.getItem("access_token");

      // 2. If no token in storage, try refresh
      if (!token) {
        token = await refreshAccessToken();
      }

      if (token) {
        const userData = await fetchUser(token);
        if (userData) {
          setAccessTokenState(token);
          sessionStorage.setItem("access_token", token);
          setUser(userData);
        } else {
          clearAuth();
        }
      }

      setIsLoading(false);
    };

    init();
  }, [fetchUser, refreshAccessToken, clearAuth]);

  // Redirect to login if not authenticated and not on a public route
  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) {
      router.replace("/auth/login");
    }
  }, [isLoading, user, isPublicRoute, router]);

  const login = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    clearAuth();
    router.replace("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
