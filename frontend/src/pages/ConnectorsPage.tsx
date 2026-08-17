import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plug,
  Plus,
  GitBranch,
  Calendar,
  MessageSquare,
  FileCode,
  Radio,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface BuiltinConnector {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'not_configured' | 'coming_soon';
  account?: string;
  scopes: string[];
}

const BUILTIN_CONNECTORS: BuiltinConnector[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connects your GitHub profile to query repositories, search issues, fetch latest pushes, and review pull requests.',
    icon: GitBranch,
    status: 'connected',
    account: '@mahes-reddy332',
    scopes: ['repo', 'read:user', 'issues:read'],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Connects Google Drive, Gmail, and Google Calendar for meeting coordination, email summaries, and document search.',
    icon: Calendar,
    status: 'connected',
    account: 'mahesreddymula@gmail.com',
    scopes: ['calendar.events', 'gmail.readonly', 'drive.readonly'],
  },
  {
    id: 'slack',
    name: 'Slack Workspace',
    description: 'Search public channels, read thread histories, and summarize team discussions.',
    icon: MessageSquare,
    status: 'not_configured',
    scopes: ['channels:read', 'chat:write'],
  },
  {
    id: 'notion',
    name: 'Notion Workspace',
    description: 'Sync workspace pages, search team databases, and query product specifications.',
    icon: FileCode,
    status: 'coming_soon',
    scopes: ['pages:read', 'databases:read'],
  },
];

export const ConnectorsPage: React.FC = () => {
  const [isAddMcpOpen, setIsAddMcpOpen] = useState(false);

  // Custom MCP servers local preview state
  const [customServers] = useState<
    Array<{
      id: string;
      name: string;
      url: string;
      transport: string;
      status: string;
      toolsCount: number;
    }>
  >([]);

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
          <span className="text-xs font-mono text-indigo-400">INTEGRATIONS & CONNECTORS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Plug className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
                Connectors & MCP Integrations
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Connect external services and register custom remote Model Context Protocol (MCP) servers.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddMcpOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-600 hover:from-indigo-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-indigo-950/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add MCP Server</span>
            </button>
          </div>
        </div>

        {/* Section 1: Built-in Connectors */}
        <div className="mb-10">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span>Built-in Connectors</span>
            <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {BUILTIN_CONNECTORS.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUILTIN_CONNECTORS.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                          {c.account && (
                            <p className="text-[11px] text-slate-400 font-mono">{c.account}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      {c.status === 'connected' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Connected</span>
                        </span>
                      )}
                      {c.status === 'not_configured' && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-mono">
                          Not Configured
                        </span>
                      )}
                      {c.status === 'coming_soon' && (
                        <span className="px-2.5 py-1 rounded-full bg-indigo-950/50 border border-indigo-800/50 text-indigo-400 text-[11px] font-mono">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex flex-wrap gap-1">
                      {c.scopes.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-mono text-[10px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {c.status === 'connected' ? (
                      <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={c.status === 'coming_soon'}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span>Configure</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom Remote MCP Servers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Custom MCP Servers</span>
              <span className="px-2 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
                {customServers.length}
              </span>
            </h2>
          </div>

          {customServers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">
                No Custom Remote MCP Servers Registered
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Connect external HTTP/SSE Model Context Protocol servers to dynamically expose tools and resources to Nexus AI.
              </p>
              <button
                type="button"
                onClick={() => setIsAddMcpOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add First Remote MCP Server</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customServers.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-100">{s.name}</h3>
                    <span className="text-xs font-mono text-emerald-400">{s.status}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 truncate mb-3">{s.url}</p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Transport: {s.transport}</span>
                    <span>Tools: {s.toolsCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add MCP Server Modal */}
      {isAddMcpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plug className="w-4 h-4 text-indigo-400" />
                <span>Add Remote MCP Server</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMcpOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Server Name</label>
                <input
                  type="text"
                  placeholder="e.g. My Company Research Server"
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  MCP Server URL <span className="text-[10px] text-slate-500 font-mono">(HTTPS in production)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://mcp.example.com/v1"
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Transport</label>
                  <select className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="streamable_http">Streamable HTTP</option>
                    <option value="sse">Server-Sent Events (SSE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Authentication</label>
                  <select className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="api_key">API Key Header</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Secret / Token (Optional)</label>
                <input
                  type="password"
                  placeholder="Bearer token or API key..."
                  className="w-full p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => alert('Connection test simulated: Reachable (Handshake OK).')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Test Connection
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMcpOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('Server registration initiated.');
                      setIsAddMcpOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold cursor-pointer shadow-md shadow-indigo-950/50"
                  >
                    Connect Server
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
