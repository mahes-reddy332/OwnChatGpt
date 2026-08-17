import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Database,
  Terminal,
  Brain,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface PluginItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  version: string;
  author: string;
  status: 'active' | 'system';
  capabilities: string[];
}

const INSTALLED_PLUGINS: PluginItem[] = [
  {
    id: 'chroma-rag-engine',
    name: 'ChromaDB Vector RAG Engine',
    category: 'Knowledge & Search',
    description: 'Semantic vector chunking and dense embedding pipeline for PDF, Markdown, and source code knowledge bases.',
    icon: Database,
    version: 'v1.0.0',
    author: 'Nexus Core System',
    status: 'system',
    capabilities: ['Vector Embeddings', 'Cosine Similarity', 'Citation Generation', 'Document Ingestion'],
  },
  {
    id: 'python-sandbox-runtime',
    name: 'Python Sandbox Code Evaluator',
    category: 'Computation & Tools',
    description: 'Isolated in-memory Python script execution runtime for calculations, data analysis, and script verification.',
    icon: Terminal,
    version: 'v1.1.0',
    author: 'Nexus Core System',
    status: 'system',
    capabilities: ['Safe Exec', 'Standard Library', 'Math & Statistics', 'Traceback Parsing'],
  },
  {
    id: 'long-term-memory-engine',
    name: 'Long-Term Memory & Deduplication Engine',
    category: 'Memory & State',
    description: 'Autonomous entity extraction, contradiction reconciliation, and retention bounding across multi-thread sessions.',
    icon: Brain,
    version: 'v1.0.0',
    author: 'Nexus Core System',
    status: 'system',
    capabilities: ['Entity Extraction', 'Contradiction Cleaner', 'Namespace Isolation', 'Profile Persistence'],
  },
  {
    id: 'fastmcp-universal-bridge',
    name: 'FastMCP Universal Protocol Bridge',
    category: 'Protocols & MCP',
    description: 'Universal Model Context Protocol client adapter supporting stdio subprocesses, SSE streams, and Streamable HTTP endpoints.',
    icon: Cpu,
    version: 'v1.2.0',
    author: 'Nexus Core System',
    status: 'system',
    capabilities: ['JSON-RPC Protocol', 'Dynamic Tool Discovery', 'Capability Filtering', 'HITL Risk Classifier'],
  },
];

export const PluginsPage: React.FC = () => {
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
          <span className="text-xs font-mono text-pink-400">WORKSPACE EXTENSION PLUGINS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Package className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
              Installed Extension Plugins
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Plugins provide modular backend functionality, execution runtimes, and protocol bridges to Nexus AI.
          </p>
        </div>

        {/* Plugin Architecture Banner */}
        <div className="mb-8 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <Sparkles className="w-5 h-5 text-pink-400 shrink-0" />
          <p>
            <strong className="text-slate-100">Modular Extension Architecture:</strong> Plugins bundle internal tools, memory handlers, and protocol adapters. Connectors manage external service accounts, while Skills organize capabilities into user workflows.
          </p>
        </div>

        {/* Plugins Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INSTALLED_PLUGINS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">{p.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">{p.category}</span>
                          <span className="text-[10px] text-slate-500">&bull;</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.version}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>System Active</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {p.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block mb-1">
                    Provided Capabilities:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {p.capabilities.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-pink-300 font-mono text-[10px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
