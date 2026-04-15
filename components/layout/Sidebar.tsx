"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ShoppingCart, Settings, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import CookbookSwitcher from "@/components/cookbooks/CookbookSwitcher";
import { useCookbookContext } from "@/contexts/CookbookContext";

const NAV_ITEMS = [
  { icon: BookOpen, label: "RECIPES", href: "/recipes" },
  { icon: CalendarDays, label: "PLANNER", href: "/planner" },
  { icon: ShoppingCart, label: "SHOPPING", href: "/shopping" },
  { icon: Settings, label: "SETTINGS", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { activeCookbook } = useCookbookContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen bg-[#0F0F0F] shrink-0 sticky top-0 overflow-y-auto">
      {/* Rouge accent stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E8200F]" />

      <div className="pl-6 pr-5 pt-8 pb-8 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
            <circle cx="12" cy="18" r="8" stroke="#FFFFFF" strokeWidth="2" fill="none" />
            <line x1="18" y1="12" x2="25" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-display text-[22px] text-white">
            <span className="font-bold">Roux</span><em className="font-bold italic">tine</em>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors"
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-[6px] h-[6px] rounded-full bg-[#E8200F]" />
                )}
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    active ? "text-[#E8200F]" : "text-[#888888] group-hover:text-white"
                  }`}
                  strokeWidth={2}
                />
                <span
                  className={`font-sans font-medium text-[11px] tracking-[0.14em] transition-colors ${
                    active ? "text-white" : "text-[#888888] group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Cookbook switcher */}
        <div className="mb-4">
          <div className="border-t border-[#2A2A2A] pt-4 mb-1" />
          <CookbookSwitcher dark />
        </div>

        {/* User footer */}
        <div className="border-t border-[#2A2A2A] pt-5 relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-1 group"
          >
            <div className="w-9 h-9 rounded-full bg-[#F7F5F2] border-2 border-[#E5E3DF] flex items-center justify-center shrink-0">
              <span className="font-sans font-medium text-[13px] text-[#0F0F0F]">
                {activeCookbook?.name?.slice(0, 2).toUpperCase() ?? "??"}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 text-left">
              <span className="font-sans font-light text-[13px] text-white truncate">
                {activeCookbook?.name ?? "My Kitchen"}
              </span>
              <span className="font-sans font-light text-[11px] text-[#888888]">Admin</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#888888] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-modal z-30 overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-[#888888] hover:text-white hover:bg-[#2A2A2A] transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" strokeWidth={2} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
