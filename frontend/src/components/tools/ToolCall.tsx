import React, { useState } from 'react';
import type { ToolCallInfo } from '../../types/tools';
import {
  Terminal,
  Code,
  FolderTree,
  Globe,
  Database,
  BookOpen,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Plug,
  FileText,
  Clock,
} from 'lucide-react';

interface ToolCallProps {
  toolCall: ToolCallInfo;
}

export const ToolCall: React.FC<ToolCallProps> = ({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'code_evaluator':
        return <Code size={13} className="text-emerald-400" />;
      case 'command_runner':
        return <Terminal size={13} className="text-amber-400" />;
      case 'filesystem_inspector':
        return <FolderTree size={13} className="text-cyan-400" />;
      case 'web_search':
      case 'fetch_web_page':
        return <Globe size={13} className="text-blue-400" />;
      case 'sql_inspector':
        return <Database size={13} className="text-purple-400" />;
      case 'tech_docs_search':
        return <BookOpen size={13} className="text-indigo-400" />;
      case 'search_knowledge_base':
        return <FileText size={13} className="text-emerald-400" />;
      default:
        return <Wrench size={13} className="text-zinc-400" />;
    }
  };

  const getCategoryBadge = () => {
    const type = toolCall.tool_type || (toolCall.name === 'search_knowledge_base' ? 'rag' : 'builtin');
    if (type === 'rag') {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold uppercase tracking-wider">
          <FileText size={9} />
          <span>RAG</span>
        </span>
      );
    }
    if (type === 'mcp') {
      return (
        <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-semibold uppercase tracking-wider">
          <Plug size={9} />
          <span>MCP</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-semibold uppercase tracking-wider">
        <Zap size={9} />
        <span>Built-in</span>
      </span>
    );
  };

  return (
    <div className="my-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden text-xs">
      {/* Header Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--color-bg-tertiary)] transition-colors text-left"
      >
        <div className="flex items-center space-x-2 min-w-0">
          {getToolIcon(toolCall.name)}
          <span className="font-mono font-semibold text-[var(--color-text-primary)]">
            {toolCall.name}
          </span>
          {getCategoryBadge()}
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono truncate max-w-[160px] sm:max-w-[220px]">
            {JSON.stringify(toolCall.args)}
          </span>
        </div>

        <div className="flex items-center space-x-2.5 flex-shrink-0 ml-2">
          {/* Latency metric if available */}
          {toolCall.execution_time_ms !== undefined && toolCall.execution_time_ms > 0 && (
            <span className="flex items-center space-x-1 text-[10px] font-mono text-[var(--color-text-tertiary)]">
              <Clock size={10} />
              <span>{Math.round(toolCall.execution_time_ms)}ms</span>
            </span>
          )}

          {toolCall.status === 'running' ? (
            <span className="flex items-center space-x-1 text-amber-400 text-[11px]">
              <Loader2 size={12} className="animate-spin" />
              <span>Running</span>
            </span>
          ) : toolCall.status === 'error' ? (
            <span className="flex items-center space-x-1 text-[var(--color-error)] text-[11px]">
              <AlertCircle size={12} />
              <span>Error</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[var(--color-success)] text-[11px]">
              <CheckCircle2 size={12} />
              <span>Done</span>
            </span>
          )}
          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] space-y-2.5 font-mono text-[11px] animate-in fade-in duration-150">
          {/* Input Arguments */}
          <div>
            <div className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] mb-1">
              Arguments
            </div>
            <pre className="p-2 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>

          {/* Result Output */}
          {toolCall.result && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-[var(--color-text-tertiary)] mb-1">
                Execution Output
              </div>
              <pre className="p-2 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
