"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLatest?: boolean;
}

export default function ChatMessage({ role, content, isLatest }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className="animate-slide-up">
      <div className="group flex gap-4 py-5 px-4 md:px-6 max-w-3xl mx-auto">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/40 to-accent-purple/40 flex items-center justify-center ring-1 ring-accent/20 shadow-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-accent-light">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" strokeWidth="1.5"/>
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-accent/15 shadow-sm">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-accent">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold tracking-wide ${isUser ? 'text-gray-300' : 'text-accent'}`}>
              {isUser ? "You" : "AI"}
            </span>
          </div>

          <div className={`text-[14.5px] leading-relaxed ${isUser ? 'text-gray-200' : 'text-gray-300 markdown-body'}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    if (match) {
                      return <CodeBlock language={match[1]} code={codeString} />;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group/code my-3 rounded-xl overflow-hidden border border-dark-border/60 bg-[#0d1117]">
      <div className="flex items-center justify-between px-4 py-2 bg-dark-hover/50 border-b border-dark-border/40">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="1.5"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="1.5"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "1rem 1.25rem",
          background: "transparent",
          fontSize: "13px",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
