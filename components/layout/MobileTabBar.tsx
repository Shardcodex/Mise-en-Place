"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, ShoppingCart, Settings } from "lucide-react";

const NAV_ITEMS = [
  { icon: BookOpen, label: "Recipes", href: "/recipes" },
  { icon: CalendarDays, label: "Planner", href: "/planner" },
  { icon: ShoppingCart, label: "Shopping", href: "/shopping" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <Icon
                className={`w-4 h-4 ${active ? "text-accent" : "text-ink-muted"}`}
                strokeWidth={2}
              />
              <span
                className={`text-[9px] ${
                  active ? "text-accent font-semibold" : "text-ink-muted"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
