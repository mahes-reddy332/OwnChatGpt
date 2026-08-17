import React, { useState, useEffect } from 'react';
import type { ToolDefinition } from '../../types/tools';
import { listTools } from '../../services/api';
import {
  X,
  Wrench,
  Terminal,
  Code,
  FolderTree,
  Globe,
  Database,
  BookOpen,
  Mail,
} from 'lucide-react';

interface ToolListModalProps {
  isOpen: boolean;
  onClose: () => void;
  disabledTools?: string[];
  onToggleTool?: (toolName: string) => void;
}

export const ToolListModal: React.FC<ToolListModalProps> = ({
  isOpen,
  onClose,
  disabledTools = [],
  onToggleTool,
}) => {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      listTools()
        .then(setTools)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'code_evaluator':
        return <Code size={16} className="text-emerald-400" />;
      case 'command_runner':
        return <Terminal size={16} className="text-amber-400" />;
      case 'filesystem_inspector':
        return <FolderTree size={16} className="text-cyan-400" />;
      case 'web_search':
      case 'fetch_web_page':
        return <Globe size={16} className="text-blue-400" />;
      case 'sql_inspector':
      case 'execute_database_mutation':
        return <Database size={16} className="text-purple-400" />;
      case 'tech_docs_search':
      case 'search_knowledge_base':
        return <BookOpen size={16} className="text-indigo-400" />;
      case 'send_email_action':
        return <Mail size={16} className="text-pink-400" />;
      default:
        return <Wrench size={16} className="text-zinc-400" />;
    }
  };

  const activeCount = tools.filter(t => !disabledTools.includes(t.name)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center space-x-2.5">
            <Wrench size={18} className="text-[var(--color-text-primary)]" />
            <div>
              <h2 className="font-semibold text-base text-[var(--color-text-primary)]">
                Registered Agent Tools ({activeCount}/{tools.length} Active)
              </h2>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Toggle tools on or off to control which capabilities the agent can use.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-3">
          {isLoading ? (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
              Loading registered tools...
            </p>
          ) : (
            tools.map((tool, idx) => {
              const isEnabled = !disabledTools.includes(tool.name);
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-[var(--radius-lg)] border transition-all duration-200 ${
                    isEnabled
                      ? 'bg-[var(--color-bg-primary)] border-[var(--color-border)]'
                      : 'bg-[var(--color-bg-primary)]/40 border-[var(--color-border)]/40 opacity-70'
                  } space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {getToolIcon(tool.name)}
                      <span className="font-mono font-semibold text-sm text-[var(--color-text-primary)]">
                        {tool.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] uppercase font-semibold">
                        {tool.is_mcp ? 'MCP Tool' : 'Built-in'}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[11px] font-medium ${
                          isEnabled
                            ? 'text-emerald-400'
                            : 'text-[var(--color-text-tertiary)]'
                        }`}
                      >
                        {isEnabled ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleTool?.(tool.name)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          isEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={isEnabled ? 'Click to disable tool' : 'Click to enable tool'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {tool.description}
                  </p>

                  {tool.parameters &&
                    tool.parameters.properties &&
                    Object.keys(tool.parameters.properties).length > 0 && (
                      <div className="pt-1.5 border-t border-[var(--color-border)]/40">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase">
                          Parameters: {Object.keys(tool.parameters.properties).join(', ')}
                        </span>
                      </div>
                    )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
