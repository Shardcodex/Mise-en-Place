"use client";

import { ChefHat } from "lucide-react";

export default function MobileHeader() {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-card border-b border-border">
      <h1 className="font-semibold text-[14px] tracking-[-0.02em] text-ink lowercase">
        mise en place
      </h1>
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-full bg-accent-bg flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-accent" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
