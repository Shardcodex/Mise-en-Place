"use client";

import { CATEGORY_ICONS } from "@/lib/constants";
import ShoppingItem from "./ShoppingItem";
import type { ShoppingItem as ShoppingItemType, IngredientCategory } from "@/lib/types";

interface CategoryGroupProps {
  category: IngredientCategory;
  items: ShoppingItemType[];
  onToggle: (check_key: string, checked: boolean) => void;
}

// Colour palette per category — matches Mowgli's warm, earthy style
const CATEGORY_COLORS: Record<
  IngredientCategory,
  { header: string; icon: string; badge: string }
> = {
  Produce:         { header: "bg-herb-light border-herb/20",    icon: "text-herb",          badge: "bg-herb text-white" },
  Dairy:           { header: "bg-blue-50 border-blue-200/50",   icon: "text-blue-500",       badge: "bg-blue-400 text-white" },
  "Meat & Seafood":{ header: "bg-berry-light border-berry/20",  icon: "text-berry",          badge: "bg-berry text-white" },
  Bakery:          { header: "bg-honey-light border-honey/20",  icon: "text-honey",          badge: "bg-honey text-white" },
  Pantry:          { header: "bg-amber-50 border-amber-200/50", icon: "text-amber-600",      badge: "bg-amber-500 text-white" },
  Frozen:          { header: "bg-sky-50 border-sky-200/50",     icon: "text-sky-500",        badge: "bg-sky-500 text-white" },
  Beverages:       { header: "bg-teal-50 border-teal-200/50",   icon: "text-teal-600",       badge: "bg-teal-500 text-white" },
  Other:           { header: "bg-bg-warm border-border",        icon: "text-ink-muted",      badge: "bg-ink-muted text-white" },
};

export default function CategoryGroup({
  category,
  items,
  onToggle,
}: CategoryGroupProps) {
  const Icon = CATEGORY_ICONS[category];
  const colors = CATEGORY_COLORS[category];
  const checkedCount = items.filter((i) => i.checked).length;
  const allChecked = checkedCount === items.length;

  return (
    <div className="bg-bg-card border border-border rounded-card overflow-hidden shadow-card print:shadow-none print:border print:break-inside-avoid">
      {/* Category header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b ${colors.header}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.icon}`} strokeWidth={1.75} />
          <span className="text-[13px] font-bold text-ink">{category}</span>
        </div>

        {/* Item count badge */}
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none ${
            allChecked && items.length > 0
              ? "bg-border text-ink-muted line-through"
              : colors.badge
          }`}
        >
          {checkedCount}/{items.length}
        </span>
      </div>

      {/* Item list */}
      <ul className="px-4 py-1">
        {items.map((item) => (
          <ShoppingItem key={item.check_key} item={item} onToggle={onToggle} />
        ))}
      </ul>
    </div>
  );
}
