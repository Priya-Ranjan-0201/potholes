import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      success("Authenticated", "Signed in to ScamRoad municipal portal.");
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please verify your login details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-atmosphere border border-border bg-surface-solid shadow-2xl overflow-hidden">
        <div className="relative hidden md:flex flex-col justify-between p-8 bg-slate-900 dark:bg-slate-950 text-white border-r border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="font-heading font-bold text-sm tracking-tight">ScamRoad</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Road Defect Inspection
            </p>
            <h2 className="font-heading font-bold text-2xl text-white leading-snug">
              Municipal road distress inspection and dispatch
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify road defects, coordinate contractor repairs, and track municipal SLA deadlines.
            </p>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Student research project · Not safety-certified
          </div>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center space-y-6 bg-surface-solid">
          <div>
            <h1 className="font-heading font-bold text-xl text-text">
              Portal Sign In
            </h1>
            <p className="text-xs text-muted mt-1">
              Access the municipal defect dashboard and camera scanner.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-text">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@scamroad.local"
                className="w-full px-3 py-2 rounded-md bg-bg-raised border border-border text-text placeholder-muted text-xs outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-text">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-md bg-bg-raised border border-border text-text placeholder-muted text-xs outline-none focus:ring-1 focus:ring-primary pr-9 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-text cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-xs py-2.5 mt-2 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : "Sign in to portal"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <Link to="/" className="hover:text-text underline">
              &larr; Back to overview
            </Link>
            <span>Research build</span>
          </div>
        </div>
      </div>
    </div>
  );
};
