"use client";

export default function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-card border-b border-border">
      <div className="flex items-center gap-2">
        {/* Ladle icon */}
        <svg width="22" height="22" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <circle cx="16" cy="14" r="9" stroke="#0F0F0F" strokeWidth="2" fill="none"/>
          <line x1="22" y1="20" x2="38" y2="38" stroke="#E8200F" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="14" r="4" fill="#E8200F" opacity="0.18"/>
        </svg>
        {/* Wordmark */}
        <h1 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink leading-none">
          Roux<em className="italic text-accent">tine</em>
        </h1>
      </div>
    </header>
  );
}
