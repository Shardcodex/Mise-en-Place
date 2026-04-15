"use client";

export default function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-5 py-4 bg-[#0F0F0F] border-b border-[#2A2A2A]">
      <div className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Rouxtine"
          style={{ height: 22, width: "auto" }}
          className="brightness-0 invert"
        />
      </div>
    </header>
  );
}
