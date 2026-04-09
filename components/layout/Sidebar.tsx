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
        <h1 className="font-semibold text-[14px] tracking-[-0.02em] text-ink lowercase leading-tight">
          mise en place
        </h1>
        <p className="text-[10px] text-ink-muted mt-1">your kitchen companion</p>
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
                  : "text-ink-muted hover:text-ink-light hover:bg-[#F5F5F2]"
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
