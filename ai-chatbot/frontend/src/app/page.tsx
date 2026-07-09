"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Bot, Database, FileUp, MoonStar, ShieldCheck, Sparkles } from "lucide-react";
import ThemeToggle from "@/components/theme/ThemeToggle";

const featureCards = [
  {
    icon: FileUp,
    title: "Upload technical files",
    description: "Drop PDFs, TXT, and DOCX files into the chat and let the backend turn them into usable context.",
  },
  {
    icon: Database,
    title: "Mongo-backed history",
    description: "Persist conversation history and file metadata in MongoDB so you can revisit past sessions safely.",
  },
  {
    icon: ShieldCheck,
    title: "Production-ready APIs",
    description: "FastAPI endpoints include request validation, logging, health checks, and clearer failure handling.",
  },
];

export default function LandingPage() {
  const { status } = useSession();
  const primaryHref = status === "authenticated" ? "/chat" : "/login";
  const primaryLabel = status === "authenticated" ? "Open Chat" : "Start Chat";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="absolute inset-0 app-grid-bg opacity-90" />
      <div className="absolute left-[8%] top-[12%] h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)]">
              <Bot size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Odoo AI Chatbot</p>
              <p className="text-sm text-[var(--text-secondary)]">Next.js, FastAPI, Gemini, MongoDB</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link href={status === "authenticated" ? "/chat" : "/login"} className="app-button-secondary rounded-full px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--border-strong)]">
              {status === "authenticated" ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-16 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-primary)] px-4 py-2 text-sm text-[var(--text-secondary)] backdrop-blur-md">
              <Sparkles size={15} className="text-[var(--accent)]" />
              Full-stack AI assistant for code, documents, and debugging
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Ship a polished AI chat product, not just another prompt box.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              This workspace combines a responsive Next.js frontend with a FastAPI backend, Gemini-powered responses, file-aware conversations, and MongoDB persistence for real chat history.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-all hover:translate-y-[-1px] hover:bg-[var(--accent-strong)]">
                {primaryLabel}
                <ArrowRight size={16} />
              </Link>
              <a href="#features" className="app-button-secondary inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors hover:border-[var(--border-strong)]">
                Explore Features
              </a>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <Stat label="LLM" value="Gemini API" />
              <Stat label="Backend" value="FastAPI" />
              <Stat label="Storage" value="MongoDB" />
            </div>
          </div>

          <div className="app-panel-strong rounded-[32px] p-6 sm:p-8">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Live Workspace</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Theme-aware UI, file upload, stored chat history</p>
                </div>
                <MoonStar size={18} className="text-[var(--accent)]" />
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">User</p>
                  <p className="mt-2 text-sm text-[var(--text-primary)]">Analyze the attached API spec and generate the FastAPI route with validation.</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Assistant</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">
                    I can process the uploaded file, store its metadata, and answer using the backend conversation state. The result will remain available in MongoDB-backed history.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">Responsive landing page</span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">Light / dark mode</span>
                  <span className="rounded-full border border-[var(--border)] px-3 py-1">Upload-aware chat</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 pb-12 md:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="app-panel rounded-3xl p-6 backdrop-blur-md transition-transform hover:-translate-y-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-glow)] text-[var(--accent)]">
                <card.icon size={20} />
              </div>
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{card.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-primary)] px-4 py-4 backdrop-blur-md">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
