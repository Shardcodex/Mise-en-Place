"use client";

import { useState, useCallback } from "react";
import { Printer, Trash2, ShoppingCart, CheckCheck } from "lucide-react";
import { useShopping } from "@/hooks/useShopping";
import { useToast } from "@/components/layout/Toast";
import CategoryGroup from "@/components/shopping/CategoryGroup";
import { CategoryGroupSkeleton } from "@/components/ui/Skeleton";
import ErrorBanner from "@/components/ui/ErrorBanner";

export default function ShoppingView() {
  const { grouped, checkedCount, totalCount, loading, error, fetchData, toggleCheck, clearChecked } =
    useShopping();
  const { showToast } = useToast();

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleToggle = useCallback(
    (check_key: string, checked: boolean) => { toggleCheck(check_key, checked); },
    [toggleCheck]
  );

  const handleClearChecked = useCallback(async () => {
    setClearing(true);
    const ok = await clearChecked();
    setClearing(false);
    setConfirmClear(false);
    if (ok) showToast(`${checkedCount} item${checkedCount !== 1 ? "s" : ""} cleared`);
    else showToast("Failed to clear items", "error");
  }, [clearChecked, checkedCount, showToast]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  return (
    <>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <h2 className="font-bold text-[22px] text-ink mb-1">Shopping List</h2>
          <p className="text-[13px] text-ink-muted">
            {loading
              ? "Generating your list…"
              : totalCount === 0
              ? "Plan some meals to generate your list"
              : checkedCount === totalCount && totalCount > 0
              ? "All done! 🎉"
              : `${totalCount - checkedCount} of ${totalCount} item${totalCount !== 1 ? "s" : ""} remaining`}
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 no-print flex-wrap">
            {checkedCount > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-2 bg-danger-bg border border-danger/20 rounded-[10px] px-3 py-2">
                  <span className="text-[12px] text-danger font-medium">
                    Clear {checkedCount} checked?
                  </span>
                  <button
                    onClick={handleClearChecked}
                    disabled={clearing}
                    className="text-[12px] font-bold text-danger hover:underline disabled:opacity-50"
                  >
                    {clearing ? "Clearing…" : "Yes"}
                  </button>
                  <span className="text-border">·</span>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-[12px] text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2.5 text-[12px] font-semibold hover:border-danger hover:text-danger transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Clear checked ({checkedCount})</span>
                </button>
              )
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2.5 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={2} />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-[24px] font-bold text-ink">Shopping List</h1>
        <p className="text-[13px] text-ink-muted">
          {totalCount} items · {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchData} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <CategoryGroupSkeleton key={i} />)}
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-20 text-ink-muted">
          <ShoppingCart className="w-14 h-14 mx-auto mb-4 opacity-30" strokeWidth={1.5} />
          <p className="text-[16px] font-medium mb-1 text-ink">Your shopping list is empty</p>
          <p className="text-[13px]">
            Add recipes to your weekly planner and they&rsquo;ll appear here.
          </p>
        </div>
      ) : checkedCount === totalCount ? (
        <div className="text-center py-20 text-ink-muted">
          <CheckCheck className="w-14 h-14 mx-auto mb-4 text-accent opacity-60" strokeWidth={1.5} />
          <p className="text-[16px] font-medium mb-1 text-ink">All items checked off!</p>
          <p className="text-[13px]">
            You&rsquo;re all set for the week.{" "}
            {checkedCount > 0 && (
              <button onClick={() => setConfirmClear(true)} className="text-accent hover:underline">
                Clear checked items
              </button>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2 print:gap-4">
          {grouped.map(({ category, items }) => (
            <CategoryGroup key={category} category={category} items={items} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </>
  );
}
