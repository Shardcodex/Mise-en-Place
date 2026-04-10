"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ShoppingCart, Settings } from "lucide-react";
import CookbookSwitcher from "@/components/cookbooks/CookbookSwitcher";

const NAV_ITEMS = [
  { icon: BookOpen, label: "Recipes", href: "/recipes" },
  { icon: CalendarDays, label: "Planner", href: "/planner" },
  { icon: ShoppingCart, label: "Shopping", href: "/shopping" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-bg-card border-r border-border shrink-0">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-2.5">
          {/* Ladle icon */}
          <svg width="28" height="28" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <circle cx="16" cy="14" r="9" stroke="#0F0F0F" strokeWidth="2" fill="none"/>
            <line x1="22" y1="20" x2="38" y2="38" stroke="#E8200F" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="16" cy="14" r="4" fill="#E8200F" opacity="0.18"/>
          </svg>
          {/* Wordmark: Roux (bold) + tine (bold italic red) */}
          <h1 className="font-display font-bold text-[18px] leading-none tracking-[-0.02em] text-ink">
            Roux<em className="not-italic italic text-accent">tine</em>
          </h1>
        </div>
        <p className="text-[10px] text-ink-muted mt-2 pl-[36px]">The foundation of every great meal.</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-all duration-200 ${
                active
                  ? "bg-accent-bg text-accent font-semibold"
                  : "text-ink-muted hover:text-ink-light hover:bg-bg-warm"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span className="text-[13px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cookbook switcher footer */}
      <div className="px-3 py-4 border-t border-border">
        <CookbookSwitcher />
      </div>
    </aside>
  );
}
