"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useState } from "react";
import { Copy, Check, User, Bot, FileText, Image as ImageIcon } from "lucide-react";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; type: string }[];
  images?: { url: string; prompt?: string }[];
}

export default function ChatBubble({ role, content, files, images }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className="animate-slide-up">
      <div className="group flex gap-4 py-5 px-4 md:px-6 max-w-3xl mx-auto">
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-glow)] ring-1 ring-[var(--border-strong)]">
              <User size={14} className="text-[var(--accent)]" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-secondary)] ring-1 ring-[var(--border-strong)]">
              <Bot size={15} className="text-[var(--accent)]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <span className={`text-xs font-semibold tracking-wide ${isUser ? "text-[var(--text-primary)]" : "text-[var(--accent)]"}`}>
            {isUser ? "You" : "AI"}
          </span>

          {files && files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                  <FileText size={12} /> {f.name}
                </div>
              ))}
            </div>
          )}

          {images && images.map((img, i) => (
            <div key={i} className="max-w-md overflow-hidden rounded-xl border border-[var(--border)]">
              <img src={img.url} alt={img.prompt || "Generated image"} className="w-full" />
              {img.prompt && <p className="bg-[var(--surface-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">{img.prompt}</p>}
            </div>
          ))}

          <div className={`text-[14.5px] leading-relaxed ${isUser ? "text-[var(--text-primary)]" : "markdown-body text-[var(--text-primary)]"}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");
                    if (match) return <CodeBlock language={match[1]} code={code} />;
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
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">{language}</span>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]">
          {copied ? <><Check size={12} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></> : <><Copy size={12} />Copy</>}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={oneDark}
        customStyle={{ margin: 0, padding: "1rem 1.25rem", background: "transparent", fontSize: "13px", lineHeight: "1.6" }}
        codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
