"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("[LOGIN] Attempting login for email:", email);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    console.log("[LOGIN] Sign-in response:", res);
    if (res?.error) {
      console.error("[LOGIN] Sign-in failed:", res.error);
      setError("Invalid email or password");
    } else {
      console.log("[LOGIN] Sign-in succeeded, redirecting to chat");
      router.push("/chat");
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-md relative animate-fade-in">
      <div className="mb-6 flex justify-end">
        <ThemeToggle compact />
      </div>
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-emerald-400/15 to-cyan-400/15">
          <Bot size={28} className="text-accent" />
        </div>
        <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
        <p className="text-sm text-[var(--text-secondary)]">Sign in to continue your AI workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="app-panel-strong rounded-2xl p-6 backdrop-blur space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="app-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="you@example.com" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="app-input w-full rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Enter your password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white
            py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:text-accent/80 font-medium">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
