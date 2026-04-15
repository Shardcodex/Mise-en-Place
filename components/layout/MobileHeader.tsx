"use client";

export default function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0F0F0F] border-b border-[#2A2A2A]">
      <div className="flex items-center gap-3">
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="12" cy="18" r="8" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          <line x1="18" y1="12" x2="25" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h1 className="font-display font-bold text-[18px] text-white leading-none">
          Roux<em className="italic">tine</em>
        </h1>
      </div>
    </header>
  );
}
