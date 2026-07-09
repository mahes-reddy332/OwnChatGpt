"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      // Auto sign in after signup
      console.log("[SIGNUP PAGE] Attempting auto sign-in after account creation");
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      setLoading(false);
      
      console.log("[SIGNUP PAGE] Sign-in response:", signInRes);
      if (signInRes?.error) {
        console.error("[SIGNUP PAGE] Sign-in failed:", signInRes.error);
        setError("Signed up successfully but auto sign-in failed. Please use the login page.");
        router.push("/login");
        return;
      }
      
      console.log("[SIGNUP PAGE] Sign-in succeeded, redirecting to chat");
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
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
        <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">Create account</h1>
        <p className="text-sm text-[var(--text-secondary)]">Start using your AI workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="app-panel-strong rounded-2xl p-6 backdrop-blur space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm text-red-400">{error}</div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Name</label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="app-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Your name" />
          </div>
        </div>

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
            <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="app-input w-full rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Min 6 characters" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white
            py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
        </button>

        <p className="text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent/80 font-medium">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
