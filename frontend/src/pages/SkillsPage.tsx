import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Puzzle,
  CheckCircle2,
  Code2,
  BookOpen,
  GitBranch,
  Calendar,
  Globe,
  Database,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface SkillItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  requiredTools: string[];
  mcpCapabilities: string[];
  enabled: boolean;
  color: string;
}

const INITIAL_SKILLS: SkillItem[] = [
  {
    id: 'code-debugging',
    name: 'Code Debugging & Execution',
    description: 'Analyze syntax errors, inspect project files, execute Python code in sandboxed runtime, and assist with complex software refactors.',
    icon: Code2,
    requiredTools: ['code_evaluator', 'filesystem_inspector', 'github_get_file_content'],
    mcpCapabilities: ['Python Sandbox', 'Host Filesystem'],
    enabled: true,
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    id: 'rag-research',
    name: 'RAG Knowledge & Document Research',
    description: 'Deep semantic vector retrieval across uploaded PDFs, technical documentation, and markdown specifications stored in ChromaDB.',
    icon: BookOpen,
    requiredTools: ['search_knowledge_base', 'tech_docs_search'],
    mcpCapabilities: ['ChromaDB Vector Store'],
    enabled: true,
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    id: 'github-assistant',
    name: 'GitHub Assistant',
    description: 'Inspect user repositories, list active branches, search issue trackers, fetch latest commits, and review code pull requests.',
    icon: GitBranch,
    requiredTools: ['github_get_my_repos', 'github_get_latest_push', 'github_get_repo', 'github_list_commits', 'github_search_issues'],
    mcpCapabilities: ['GitHub FastMCP Protocol'],
    enabled: true,
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace Operations',
    description: 'Coordinate calendar meetings, list upcoming events, search and summarize email threads, and retrieve Google Drive files.',
    icon: Calendar,
    requiredTools: ['gcalendar_list_events', 'gcalendar_create_event', 'gmail_search_emails', 'gmail_read_thread', 'gdrive_search_files'],
    mcpCapabilities: ['Google FastMCP Server (Drive, Gmail, Calendar)'],
    enabled: true,
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
  {
    id: 'web-research',
    name: 'Web Research & Intelligence',
    description: 'Perform real-time web searches, fetch full web page contents in markdown, and synthesize up-to-date online information.',
    icon: Globe,
    requiredTools: ['web_search', 'fetch_web_page'],
    mcpCapabilities: ['Web Search API'],
    enabled: true,
    color: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  },
  {
    id: 'sql-inspection',
    name: 'SQL & Database Inspector',
    description: 'Inspect relational schemas, run read-only database queries, and perform approved Human-in-the-Loop database mutations.',
    icon: Database,
    requiredTools: ['sql_inspector', 'execute_database_mutation'],
    mcpCapabilities: ['Database Engine Bridge'],
    enabled: true,
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
];

export const SkillsPage: React.FC = () => {
  const [skills, setSkills] = useState<SkillItem[]>(INITIAL_SKILLS);

  const toggleSkill = (id: string) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

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
          <span className="text-xs font-mono text-emerald-400">AGENT SKILL REGISTRY</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Puzzle className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-50 tracking-tight">
              Agent Skills
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Skills are high-level multi-step capabilities orchestrating tools, RAG vector retrieval, and MCP servers.
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => {
            const Icon = skill.icon;
            return (
              <div
                key={skill.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${skill.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-100">{skill.name}</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {skill.enabled ? 'Active Workflow' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className="cursor-pointer"
                      title={skill.enabled ? 'Disable skill' : 'Enable skill'}
                    >
                      {skill.enabled ? (
                        <ToggleRight className="w-7 h-7 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {skill.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block mb-1">
                      Required Tools:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skill.requiredTools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[10px]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider block mb-1">
                      MCP / Protocol:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skill.mcpCapabilities.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono text-[10px]"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
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
