import * as SecureStore from "expo-secure-store";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  // false until the saved session has been read from storage, so screens
  // don't mistake "not loaded yet" for "logged out" and bounce to /login.
  ready: boolean;
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "examproject.session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setToken(parsed.token);
          setUser(parsed.user);
        }
      } catch {
        // SecureStore unavailable - stay logged out.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setSession = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser })).catch(() => {
      // ignore storage failures
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {
      // ignore storage failures
    });
  };

  return <AuthContext.Provider value={{ ready, token, user, setSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
