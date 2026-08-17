import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock';
import { DataTable } from './DataTable';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Normalizes streaming Markdown by temporarily closing unclosed code fences in-memory.
 * Never mutates the original message content in state.
 */
function normalizeStreamingMarkdown(rawContent: string, isStreaming?: boolean): string {
  if (!isStreaming || !rawContent) return rawContent;

  // Count code fence delimiters
  const matches = rawContent.match(/```/g);
  const fenceCount = matches ? matches.length : 0;

  // If odd number of fences, close the code block temporarily for the parser
  if (fenceCount % 2 !== 0) {
    return `${rawContent}\n\`\`\``;
  }

  return rawContent;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming }) => {
  const normalizedContent = useMemo(
    () => normalizeStreamingMarkdown(content, isStreaming),
    [content, isStreaming]
  );

  return (
    <div className="w-full max-w-full overflow-hidden text-sm leading-relaxed text-[var(--color-text-primary)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] mt-4 mb-2 pb-1 border-b border-[var(--color-border)] tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mt-3.5 mb-1.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] mt-3 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] mt-2.5 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-[var(--color-text-primary)] mb-3 last:mb-0">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2.5 pl-5 list-disc space-y-1 text-sm text-[var(--color-text-primary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 pl-5 list-decimal space-y-1 text-sm text-[var(--color-text-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed my-0.5">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--color-info)] bg-[var(--color-bg-secondary)] pl-3.5 py-2 my-3 rounded-r-[var(--radius-md)] text-xs text-[var(--color-text-secondary)] italic">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-info)] hover:underline font-medium transition-colors"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-t border-[var(--color-border)] my-4" />,
          table: ({ children }) => <DataTable>{children}</DataTable>,
          thead: ({ children }) => (
            <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--color-border)]/40">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--color-bg-tertiary)]/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] border-r border-[var(--color-border)]/40 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-xs text-[var(--color-text-primary)] border-r border-[var(--color-border)]/40 last:border-r-0">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isCodeBlock = match || String(children).includes('\n');

            if (isCodeBlock) {
              return (
                <CodeBlock
                  language={match ? match[1] : undefined}
                  value={String(children)}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-[11px] border border-[var(--color-border)]/60"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      {/* Streaming pulse cursor */}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-text-primary)] align-middle animate-pulse rounded-[1px]"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
