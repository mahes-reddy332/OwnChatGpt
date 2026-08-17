import React, { useState, useEffect } from 'react';
import type { MCPServerConfig, MCPTransportType } from '../../types/mcp';
import {
  listMCPServers,
  addOrUpdateMCPServer,
  deleteMCPServer,
  reloadMCPServers,
} from '../../services/api';
import {
  X,
  Cpu,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Power,
  Globe,
  Terminal,
} from 'lucide-react';

interface MCPServersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MCPServersModal: React.FC<MCPServersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New server form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newTransport, setNewTransport] = useState<MCPTransportType>('stdio');
  const [newCommand, setNewCommand] = useState('npx');
  const [newArgs, setNewArgs] = useState('-y @modelcontextprotocol/server-github');
  const [newUrl, setNewUrl] = useState('');

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const data = await listMCPServers();
      setServers(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchServers();
      setShowAddForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleServer = async (server: MCPServerConfig) => {
    try {
      const updated: MCPServerConfig = { ...server, enabled: !server.enabled };
      await addOrUpdateMCPServer(updated);
      fetchServers();
    } catch {
      // ignore
    }
  };

  const handleDeleteServer = async (id: string) => {
    try {
      await deleteMCPServer(id);
      fetchServers();
    } catch {
      // ignore
    }
  };

  const handleReload = async () => {
    try {
      setIsReloading(true);
      await reloadMCPServers();
      await fetchServers();
    } finally {
      setIsReloading(false);
    }
  };

  const handleAddServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    const payload: MCPServerConfig = {
      id: newId.trim().toLowerCase().replace(/\s+/g, '_'),
      name: newName.trim(),
      transport: newTransport,
      command: newTransport === 'stdio' ? newCommand.trim() : undefined,
      args:
        newTransport === 'stdio'
          ? newArgs.split(' ').filter(Boolean)
          : undefined,
      url:
        newTransport in ['sse', 'streamable_http'] || newTransport === 'sse'
          ? newUrl.trim()
          : undefined,
      enabled: true,
    };

    try {
      await addOrUpdateMCPServer(payload);
      setShowAddForm(false);
      setNewId('');
      setNewName('');
      setNewUrl('');
      fetchServers();
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center space-x-2">
            <Cpu size={18} className="text-cyan-400" />
            <h2 className="font-semibold text-base text-[var(--color-text-primary)]">
              Model Context Protocol (MCP) Servers
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReload}
              disabled={isReloading}
              className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center space-x-1 text-xs"
              title="Reconnect & Reload Tools"
            >
              <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-secondary)]">
              Connect local and remote tools via the Model Context Protocol.
            </p>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-primary)] transition-colors"
            >
              <Plus size={14} />
              <span>{showAddForm ? 'Cancel' : 'Add Server'}</span>
            </button>
          </div>

          {/* Add Server Form */}
          {showAddForm && (
            <form
              onSubmit={handleAddServerSubmit}
              className="p-4 rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-3 animate-in fade-in duration-150"
            >
              <h3 className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                New MCP Server Configuration
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                    Server ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. github_mcp"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GitHub Integration"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                  Transport Type
                </label>
                <select
                  value={newTransport}
                  onChange={e =>
                    setNewTransport(e.target.value as MCPTransportType)
                  }
                  className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none"
                >
                  <option value="stdio">stdio (Local Subprocess / CLI)</option>
                  <option value="streamable_http">
                    streamable_http (FastMCP / Remote Endpoint)
                  </option>
                  <option value="sse">sse (Server-Sent Events Endpoint)</option>
                </select>
              </div>

              {newTransport === 'stdio' ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                      Command
                    </label>
                    <input
                      type="text"
                      placeholder="npx or python"
                      value={newCommand}
                      onChange={e => setNewCommand(e.target.value)}
                      className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                      Arguments
                    </label>
                    <input
                      type="text"
                      placeholder="-y @modelcontextprotocol/server-github"
                      value={newArgs}
                      onChange={e => setNewArgs(e.target.value)}
                      className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none font-mono text-[11px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs">
                  <label className="block text-[11px] text-[var(--color-text-tertiary)] mb-1">
                    Server URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://splendid-gold-dingo.fastmcp.app/mcp"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] px-2.5 py-1.5 rounded border border-[var(--color-border)] focus:outline-none font-mono text-[11px]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] font-medium rounded text-xs hover:opacity-90 transition-opacity"
              >
                Save & Connect Server
              </button>
            </form>
          )}

          {/* Servers List */}
          <div className="space-y-2.5">
            {isLoading ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
                Loading MCP servers...
              </p>
            ) : servers.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6 bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
                No MCP servers configured yet.
              </p>
            ) : (
              servers.map(server => (
                <div
                  key={server.id}
                  className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {server.transport === 'stdio' ? (
                        <Terminal
                          size={15}
                          className="text-[var(--color-text-tertiary)]"
                        />
                      ) : (
                        <Globe
                          size={15}
                          className="text-[var(--color-text-tertiary)]"
                        />
                      )}
                      <span className="font-medium text-sm text-[var(--color-text-primary)]">
                        {server.name}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        ({server.id})
                      </span>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-3">
                      {server.status === 'connected' ? (
                        <span className="flex items-center space-x-1 text-xs text-[var(--color-success)]">
                          <CheckCircle2 size={13} />
                          <span>Connected ({server.tools_count || 0} tools)</span>
                        </span>
                      ) : server.status === 'connecting' ? (
                        <span className="flex items-center space-x-1 text-xs text-amber-400">
                          <Clock size={13} />
                          <span>Connecting...</span>
                        </span>
                      ) : server.status === 'error' ? (
                        <span className="flex items-center space-x-1 text-xs text-[var(--color-error)]">
                          <AlertCircle size={13} />
                          <span>Failed</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          Disabled
                        </span>
                      )}

                      <button
                        onClick={() => handleToggleServer(server)}
                        className={`p-1 rounded transition-colors ${
                          server.enabled
                            ? 'text-[var(--color-success)] hover:opacity-75'
                            : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                        title={server.enabled ? 'Disable Server' : 'Enable Server'}
                      >
                        <Power size={14} />
                      </button>

                      <button
                        onClick={() => handleDeleteServer(server.id)}
                        className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors"
                        title="Delete Server"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Server Details */}
                  <div className="text-[11px] font-mono text-[var(--color-text-tertiary)] truncate">
                    {server.transport === 'stdio'
                      ? `${server.command} ${server.args?.join(' ') || ''}`
                      : server.url}
                  </div>

                  {server.error && (
                    <div className="text-[10px] text-[var(--color-error)] bg-[var(--color-error)]/10 p-1.5 rounded">
                      {server.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
