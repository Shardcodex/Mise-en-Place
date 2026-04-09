/**
 * Skeleton screens — all shimmer-pulsed, sized to match their real counterparts.
 * Import only what you need.
 */

// ─── Base pulse ───────────────────────────────────────────────────────────────

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-warm ${className}`} />;
}

// ─── Recipe card ──────────────────────────────────────────────────────────────

export function RecipeCardSkeleton() {
  return (
    <div className="bg-bg-card border border-border rounded-card overflow-hidden">
      {/* Top colour bar */}
      <Pulse className="h-[3px] w-full rounded-none" />
      <div className="p-5 space-y-3">
        {/* Emoji circle + time */}
        <div className="flex items-start justify-between">
          <Pulse className="w-11 h-11 rounded-full" />
          <Pulse className="w-12 h-3 rounded-full" />
        </div>
        {/* Name */}
        <Pulse className="h-4 w-3/4 rounded-full" />
        {/* Meta row */}
        <div className="flex gap-3">
          <Pulse className="h-3 w-20 rounded-full" />
          <Pulse className="h-3 w-16 rounded-full" />
        </div>
        {/* Tags */}
        <div className="flex gap-1.5">
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────

export function DayCardSkeleton() {
  return (
    <div className="bg-bg-card border border-border rounded-card p-4 space-y-3">
      {/* Day header */}
      <div className="flex items-center gap-2.5">
        <Pulse className="w-9 h-9 rounded-full flex-shrink-0" />
        <div className="space-y-1.5">
          <Pulse className="h-3.5 w-20 rounded-full" />
          <Pulse className="h-3 w-12 rounded-full" />
        </div>
      </div>
      {/* 4 meal slots */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="py-2 border-b border-border/60 last:border-b-0 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Pulse className="w-3.5 h-3.5 rounded" />
              <Pulse className="h-2.5 w-14 rounded-full" />
            </div>
            <Pulse className="w-5 h-5 rounded-full" />
          </div>
          {i < 2 && <Pulse className="h-7 w-full rounded-[10px]" />}
        </div>
      ))}
    </div>
  );
}

// ─── Category group ───────────────────────────────────────────────────────────

export function CategoryGroupSkeleton() {
  return (
    <div className="bg-bg-card border border-border rounded-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-bg-warm">
        <div className="flex items-center gap-2">
          <Pulse className="w-4 h-4 rounded" />
          <Pulse className="h-3 w-20 rounded-full" />
        </div>
        <Pulse className="h-4 w-8 rounded-full" />
      </div>
      {/* Items */}
      <ul className="px-4 py-1 space-y-0">
        {[...Array(4)].map((_, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-b-0">
            <Pulse className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="flex gap-2">
                <Pulse className="h-3 w-24 rounded-full" />
                <Pulse className="h-3 w-12 rounded-full" />
              </div>
              <div className="flex gap-1">
                <Pulse className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Settings row ─────────────────────────────────────────────────────────────

export function SettingsRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60">
      <div className="space-y-1.5">
        <Pulse className="h-3 w-28 rounded-full" />
        <Pulse className="h-2.5 w-44 rounded-full" />
      </div>
      <Pulse className="h-9 w-32 rounded-input" />
    </div>
  );
}
