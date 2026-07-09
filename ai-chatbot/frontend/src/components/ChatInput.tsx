"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="bg-dark-bg pb-4 pt-2">
      <div className="max-w-3xl mx-auto px-4">
        <div
          className={`flex items-end gap-3 rounded-2xl border px-4 py-3
            bg-dark-surface/60 backdrop-blur-sm
            transition-all duration-200 ease-out
            ${
              focused
                ? "border-accent/40 shadow-glow-sm"
                : "border-dark-border/60 hover:border-dark-border"
            }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Message AI Code Debugger..."
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-600
              resize-none focus:outline-none text-sm leading-6 max-h-[200px]"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-2.5 rounded-xl transition-all duration-200 flex-shrink-0
              ${
                canSend
                  ? "bg-accent text-white hover:bg-accent-hover shadow-glow-sm active:scale-95"
                  : "bg-dark-hover text-gray-600 cursor-not-allowed"
              }`}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 11L12 6L17 11M12 6V18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-700 mt-2.5 tracking-wide">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
