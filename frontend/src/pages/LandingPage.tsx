import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Database,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Nexus AI"
              className="w-9 h-9 rounded-lg object-contain shadow-md shadow-cyan-950/50 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Nexus AI
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1">
                AGENTIC WORKSPACE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-950/40 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-24 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium mb-8 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Multi-Agent LangGraph ReAct Orchestration & FastMCP</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-50 mb-6 leading-tight">
              Autonomous Intelligence.{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Real-World Action.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
              Nexus AI is a professional agentic assistant combining live external tool execution, RAG document knowledge retrieval, persistent long-term memory, and interactive human-in-the-loop safety controls.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-medium border border-slate-700/80 transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In to Account</span>
              </Link>
            </div>

            {/* Capability Badges */}
            <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400 font-mono">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>FastMCP Protocols</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>ChromaDB Vector RAG</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>HITL Safety Review</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <span>Long-Term Memory</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-20 bg-slate-900/40 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
                Architected for Serious AI Workflows
              </h2>
              <p className="text-sm text-slate-400">
                Nexus AI operates with full user isolation, enterprise-grade session management, and multi-tool agency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: FastMCP */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg shadow-black/40 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">FastMCP & Connected Tools</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Seamlessly interacts with Google Drive, Gmail, Calendar, GitHub repositories, Python code sandbox, and SQL query inspection.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-cyan-300">
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">GitHub</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">G-Workspace</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">Code Exec</span>
                </div>
              </div>

              {/* Card 2: Vector RAG */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all shadow-lg shadow-black/40 group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">RAG Knowledge Base</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Ingest PDF documents, markdown specs, and codebases into ChromaDB vector store with semantic citations and verifiable source pills.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-blue-300">
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">ChromaDB</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">Embeddings</span>
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">Citations</span>
                </div>
              </div>

              {/* Card 3: HITL Safety */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-lg shadow-black/40 group">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">Human-in-the-Loop Safety</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Sensitive actions pause execution and request interactive human approval, parameter modification, or cancellation before committing.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-indigo-300">
                  <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Interrupts</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Approval Cards</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">Safe Resume</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Nexus AI" className="w-6 h-6 rounded" />
            <span className="font-semibold text-slate-300">Nexus AI</span>
            <span>&mdash; Enterprise Agentic Workspace</span>
          </div>
          <p className="text-slate-400">&copy; 2026 Nexus AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
