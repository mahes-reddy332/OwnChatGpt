"use client";

import { useState, useRef, KeyboardEvent, DragEvent } from "react";
import { toast } from "sonner";
import { Send, Paperclip, Mic, MicOff, X, FileText, Image as ImageIcon, Sparkles, Search } from "lucide-react";

interface AttachedFile {
  uploadId?: string;
  name: string;
  type: string;
  content: string;
  size?: number;
  preview?: string;
}

interface ChatInputProps {
  onSend: (message: string, files?: AttachedFile[], mode?: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = (mode?: string) => {
    const trimmed = input.trim();
    const finalMessage = trimmed || (files.length > 0 ? "Please analyze the attached document(s)." : "");
    if ((!finalMessage && files.length === 0) || disabled) return;
    onSend(finalMessage, files.length > 0 ? files : undefined, mode);
    setInput("");
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 200) + "px"; }
  };

  const handleFileUpload = async (fileList: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const supported = /\.(pdf|txt|doc|docx|md)$/i.test(file.name) || file.type === "application/pdf" || file.type.startsWith("text/");
        if (!supported) {
          toast.error(`${file.name} is not supported. Use PDF, TXT, DOC, or DOCX.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }
        setFiles((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + text);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const canSend = (input.trim() || files.length > 0) && !disabled;

  return (
    <div className="relative bg-[var(--bg-primary)] pb-4 pt-2"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--accent-glow)]
          flex items-center justify-center pointer-events-none">
          <p className="text-sm font-medium text-[var(--accent)]">Drop files here</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        {/* Attached files */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-primary)] px-3 py-1.5 text-xs text-[var(--text-primary)]">
                {f.type?.startsWith("image/") ? (
                  f.preview ? <img src={f.preview} alt="" className="w-8 h-8 rounded object-cover" /> : <ImageIcon size={14} />
                ) : <FileText size={14} />}
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-[var(--text-muted)] hover:text-red-400">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-end gap-2 rounded-2xl border px-4 py-3 app-panel backdrop-blur-sm transition-all duration-200
          ${focused ? "border-[var(--accent)] shadow-glow-sm" : "hover:border-[var(--border-strong)]"}
          ${uploading ? "opacity-70" : ""}`}
        >
          <button onClick={() => fileInputRef.current?.click()} disabled={disabled}
            className="flex-shrink-0 rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
            <Paperclip size={18} />
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,.md"
            className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />

          <textarea ref={textareaRef} value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} onInput={handleInput}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder="Message AI..."
            disabled={disabled} rows={1}
            className="max-h-[200px] flex-1 resize-none bg-transparent text-sm leading-6 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
          />

          <button onClick={toggleVoice} disabled={disabled}
            className={`flex-shrink-0 rounded-lg p-1.5 transition-colors
              ${listening ? "bg-red-500/10 text-red-400" : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"}`}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <div className="relative">
            <button onClick={() => setShowModes(!showModes)} disabled={disabled}
              className="flex-shrink-0 rounded-lg p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
              <Sparkles size={18} />
            </button>
            {showModes && (
              <div className="absolute bottom-full right-0 z-20 mb-2 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-elevated animate-slide-up">
                <button onClick={() => { handleSend("research"); setShowModes(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]">
                  <Search size={15} className="text-accent" /> Deep Research
                </button>
                <button onClick={() => { handleSend("image"); setShowModes(false); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]">
                  <ImageIcon size={15} className="text-accent-purple" /> Generate Image
                </button>
              </div>
            )}
          </div>

          <button onClick={() => handleSend()} disabled={!canSend}
            className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0
              ${canSend ? "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-glow-sm active:scale-95" : "cursor-not-allowed bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>
            <Send size={16} />
          </button>
        </div>

        <p className="mt-2 text-center text-[10px] tracking-wide text-[var(--text-muted)]">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
