"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchCurrentUser, signOut as signOutApi, type ApiUser } from "@/src/lib/api";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: ApiUser | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const currentUser = await fetchCurrentUser(apiBase);
      setUser(currentUser);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    // Defined inline (rather than calling the refresh() above) so this
    // effect's setState calls are visibly gated behind an await from
    // React's static analysis - see react-hooks/set-state-in-effect.
    async function checkAuth() {
      try {
        const currentUser = await fetchCurrentUser(apiBase);
        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        setUser(null);
        setStatus("anonymous");
      }
    }

    checkAuth();
  }, []);

  const signOut = useCallback(async () => {
    await signOutApi(apiBase);
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
