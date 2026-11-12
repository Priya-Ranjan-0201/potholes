import React, { createContext, useContext, useState, useEffect } from "react";
import { api, UserProfile, getStoredToken, setStoredTokens, clearStoredTokens } from "../api/client";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  activeRole: string;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  // Initialize or fetch me
  useEffect(() => {
    async function loadUser() {
      const stored = getStoredToken();
      const defaultPassword = (import.meta.env.VITE_DEMO_PASSWORD as string) || "ScamRoadDemo2026!";
      if (!stored) {
        // Attempt login first for pre-initialized local account; fall back to registration on fresh DB.
        try {
          const loginRes = await api.login({
            email: "engineer@scamroad.org",
            password: defaultPassword,
          });
          setStoredTokens(loginRes.access_token, loginRes.refresh_token);
          setToken(loginRes.access_token);
          setUser(loginRes.user);
        } catch {
          try {
            const res = await api.register({
              email: "engineer@scamroad.org",
              password: defaultPassword,
              full_name: "Road Survey User",
              role: "admin",
            });
            setStoredTokens(res.access_token, res.refresh_token);
            setToken(res.access_token);
            setUser(res.user);
          } catch {
            clearStoredTokens();
          }
        }
      } else {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch {
          clearStoredTokens();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setStoredTokens(res.access_token, res.refresh_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, pass: string, name: string, role = "citizen") => {
    const res = await api.register({ email, password: pass, full_name: name, role });
    setStoredTokens(res.access_token, res.refresh_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    clearStoredTokens();
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: string) => {
    const demoEmail = `${role}_demo@scamroad.org`;
    const demoPass = "DemoPassword123!";
    try {
      await login(demoEmail, demoPass);
    } catch {
      await register(demoEmail, demoPass, `${role.toUpperCase()} Officer`, role);
    }
  };

  const activeRole = user?.roles[0]?.toLowerCase() || "citizen";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

