import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  Zap,
  Database,
  ShieldCheck,
  Cpu,
  Clock,
  Puzzle,
  Plug,
  Package,
  Layers,
} from 'lucide-react';

export const HelpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat Workspace</span>
          </Link>
          <span className="text-xs font-mono text-purple-400">HELP & CAPABILITIES REFERENCE</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-slate-50 tracking-tight mb-1">
            Nexus AI Capabilities & Architectural Guide
          </h1>
          <p className="text-xs text-slate-400">
            A comprehensive reference explaining the relationships between Skills, Connectors, Plugins, Tools, and Safety Boundaries.
          </p>
        </div>

        {/* Conceptual Hierarchy Card */}
        <div className="mb-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Understanding Nexus AI Architecture Concepts</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-800/40">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                <Puzzle className="w-4 h-4" />
                <span>Skills</span>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong>What the agent can accomplish.</strong> High-level workflows orchestrating tools, RAG, and memory (e.g. Code Debugging, GitHub Assistant).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-800/40">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1">
                <Plug className="w-4 h-4" />
                <span>Connectors</span>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong>External service connections.</strong> Authenticated links to GitHub, Google Workspace, or custom remote MCP servers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-pink-800/40">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-xs mb-1">
                <Package className="w-4 h-4" />
                <span>Plugins</span>
              </div>
              <p className="text-[11px] text-slate-300">
                <strong>Installed system extensions.</strong> Core backend packages providing capabilities like ChromaDB RAG and Python Code Sandbox.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Agent ReAct Loop */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">LangGraph Cyclical ReAct Loop</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nexus AI uses a state graph (<code className="text-cyan-400">chat_node</code> &rarr; <code className="text-cyan-400">tools_node</code>) that dynamically binds only your active, approved tools to reason, execute, observe, and summarize responses.
            </p>
          </div>

          {/* Card 2: FastMCP & Custom Servers */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Model Context Protocol (MCP)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supports stdio subprocesses for built-in tools and Streamable HTTP / SSE transports for custom remote servers with automated capability discovery and SSRF protection.
            </p>
          </div>

          {/* Card 3: RAG Knowledge Base */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">ChromaDB Vector RAG</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Upload PDF documents or markdown specs to index them into ChromaDB. Semantic citations are dynamically retrieved and presented as clickable reference pills.
            </p>
          </div>

          {/* Card 4: HITL Safety */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Human-in-the-Loop Safety Controls</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              High-risk actions (sending emails, modifying databases, executing shell scripts) pause graph execution via <code className="text-emerald-400">interrupt()</code> and render interactive approval cards before execution.
            </p>
          </div>

          {/* Card 5: Long-Term Memory */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Long-Term Memory Deduplication</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Memories are extracted and stored under user-isolated namespaces. Contradictions and duplicates are automatically cleaned to maintain bounded context size.
            </p>
          </div>

          {/* Card 6: Authoritative Sessions */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Authoritative Session Security</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sessions use SHA-256 hashed opaque tokens in HttpOnly cookies, 30-minute idle timeouts, anti-CSRF double-submit protection, and hard 7-day absolute lifetimes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
