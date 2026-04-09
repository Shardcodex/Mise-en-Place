"use client";

import type { ShoppingItem as ShoppingItemType } from "@/lib/types";

interface ShoppingItemProps {
  item: ShoppingItemType;
  onToggle: (check_key: string, checked: boolean) => void;
}

/**
 * Format a single amount entry into a human-readable string.
 * e.g.  { amount: "2", unit: "cups", scale: 1   } → "2 cups"
 *       { amount: "2", unit: "cups", scale: 1.5 } → "2 cups ×1.5"
 */
function formatAmount(entry: { amount: string; unit: string; scale: number }): string {
  const parts: string[] = [];
  if (entry.amount) parts.push(entry.amount);
  if (entry.unit) parts.push(entry.unit);
  const base = parts.join(" ");
  if (entry.scale !== 1) {
    return `${base} ×${entry.scale}`;
  }
  return base;
}

export default function ShoppingItem({ item, onToggle }: ShoppingItemProps) {
  const amountString = item.amounts.map(formatAmount).join(" + ") || null;

  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-b-0 group">
      {/* Circular checkbox */}
      <button
        onClick={() => onToggle(item.check_key, !item.checked)}
        className={`
          mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-150 print:border-ink print:bg-transparent
          ${
            item.checked
              ? "bg-accent border-accent"
              : "border-border bg-transparent hover:border-accent"
          }
        `}
        aria-label={item.checked ? "Uncheck" : "Check"}
        aria-checked={item.checked}
        role="checkbox"
      >
        {item.checked && (
          <svg
            className="w-2.5 h-2.5 text-white print:text-ink"
            viewBox="0 0 10 8"
            fill="none"
          >
            <path
              d="M1 4l2.5 2.5L9 1"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + amounts on one line */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-[13px] font-semibold leading-snug transition-colors ${
              item.checked ? "text-ink-muted line-through" : "text-ink"
            }`}
          >
            {item.ingredient_name}
          </span>
          {amountString && (
            <span
              className={`text-[12px] leading-snug transition-colors ${
                item.checked ? "text-ink-muted/60 line-through" : "text-ink-muted"
              }`}
            >
              {amountString}
            </span>
          )}
        </div>

        {/* Recipe source tags */}
        {item.source_recipes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.source_recipes.map((r) => (
              <span
                key={r.id}
                className={`inline-flex items-center gap-0.5 text-[10px] rounded-full px-2 py-0.5 leading-none transition-colors print:border print:border-border ${
                  item.checked
                    ? "bg-bg-warm text-ink-muted/60"
                    : "bg-bg-warm text-ink-muted"
                }`}
              >
                <span className="text-[10px]">{r.emoji}</span>
                <span className="truncate max-w-[100px]">{r.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
