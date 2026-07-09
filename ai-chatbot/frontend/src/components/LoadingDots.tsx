"use client";

export default function LoadingDots() {
  return (
    <div className="animate-fade-in">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-5 flex gap-4">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-emerald-500/20
          flex items-center justify-center ring-1 ring-accent/15 shadow-sm flex-shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-accent">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-1.5 pt-3">
          <span className="w-2 h-2 rounded-full bg-accent/60 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent/60 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
          <span className="w-2 h-2 rounded-full bg-accent/60 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
