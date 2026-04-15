"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { usePlanner } from "@/hooks/usePlanner";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/layout/Toast";
import { useCookbookContext } from "@/contexts/CookbookContext";
import DayCard from "@/components/planner/DayCard";
import { RecipePickerAdd, RecipePickerEdit } from "@/components/planner/RecipePicker";
import { DayCardSkeleton } from "@/components/ui/Skeleton";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { getOrderedDays } from "@/lib/constants";
import type { PlannerAssignment, DayName, MealType } from "@/lib/types";

// ─── Week date helpers ────────────────────────────────────────────────────────

const JS_DAY_INDEX: Record<DayName, number> = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

const JS_INDEX_TO_DAY: DayName[] = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function getWeekDates(weekOffset: number, weekStartDay: DayName): Record<DayName, Date> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (today.getDay() - JS_DAY_INDEX[weekStartDay] + 7) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - diff + weekOffset * 7);
  const result = {} as Record<DayName, Date>;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    result[JS_INDEX_TO_DAY[d.getDay()]] = d;
  }
  return result;
}

function formatWeekRange(weekDates: Record<DayName, Date>): string {
  const dates = Object.values(weekDates).sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates[dates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (first.getFullYear() !== last.getFullYear())
    return `${first.toLocaleDateString("en-US", { ...opts, year: "numeric" })} – ${last.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  if (first.getMonth() !== last.getMonth())
    return `${first.toLocaleDateString("en-US", opts)} – ${last.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  return `${first.toLocaleDateString("en-US", opts)} – ${last.getDate()}, ${last.getFullYear()}`;
}

// ─── View ──────────────────────────────────────────────────────────────────────

export default function PlannerView() {
  const { activeCookbook } = useCookbookContext();
  const { showToast } = useToast();

  const [weekOffset, setWeekOffset] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<{ day: DayName; mealType: MealType }>({
    day: "Monday", mealType: "dinner",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<PlannerAssignment | null>(null);

  // weekStartDay is held in state so it can be initialised before profile loads
  // (defaults to Monday; synced from profile once it arrives)
  const [weekStartDay, setWeekStartDay] = useState<DayName>("Monday");
  const orderedDays = useMemo(() => getOrderedDays(weekStartDay), [weekStartDay]);
  const weekDates = useMemo(() => getWeekDates(weekOffset, weekStartDay), [weekOffset, weekStartDay]);

  // ISO date (YYYY-MM-DD, local time) of the first day of the displayed week
  const weekStartDate = useMemo(() => {
    const d = weekDates[weekStartDay];
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  }, [weekDates, weekStartDay]);

  // usePlanner needs weekStartDate to scope the DB query — must be called after weekStartDate
  const { assignments, profile, loading, error, fetchData, addAssignment, addLeftover, updateAssignment, removeAssignment } =
    usePlanner(weekStartDate);
  const { recipes } = useRecipes(activeCookbook?.id);

  // Once profile loads, sync the user's preferred week-start day
  useEffect(() => {
    if (profile?.week_start_day) {
      setWeekStartDay(profile.week_start_day as DayName);
    }
  }, [profile?.week_start_day]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    return formatWeekRange(weekDates);
  }, [weekOffset, weekDates]);

  const handleAdd = useCallback((day: DayName, mealType: MealType) => {
    setAddTarget({ day, mealType });
    setAddOpen(true);
  }, []);

  const handleEdit = useCallback((assignment: PlannerAssignment) => {
    setEditAssignment(assignment);
    setEditOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await removeAssignment(id);
    if (!ok) showToast("Failed to remove meal", "error");
  }, [removeAssignment, showToast]);

  const handleAddConfirm = useCallback(async (recipe_id: string, day: DayName, meal_type: MealType, scale: number) => {
    const ok = await addAssignment(recipe_id, day, meal_type, scale);
    if (ok) showToast("Meal added to plan");
    else showToast("Failed to add meal", "error");
  }, [addAssignment, showToast]);

  const handleAddLeftover = useCallback(async (
    sourceAssignment: PlannerAssignment,
    day: DayName,
    meal_type: MealType
  ) => {
    const ok = await addLeftover(sourceAssignment, day, meal_type);
    if (ok) showToast("Leftovers added to plan");
    else showToast("Failed to add leftovers", "error");
  }, [addLeftover, showToast]);

  const handleEditConfirm = useCallback(async (id: string, changes: { scale: number; day: DayName; meal_type: MealType }) => {
    const ok = await updateAssignment(id, changes);
    if (ok) showToast("Meal updated");
    else showToast("Failed to update meal", "error");
  }, [updateAssignment, showToast]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-[32px] text-[#0F0F0F] mb-1">Planner</h1>
          <p className="font-sans text-[13px] text-[#888888]">
            {loading
              ? "Loading your plan…"
              : assignments.length === 0
              ? "Tap + on any meal slot to add a recipe"
              : `${assignments.length} meal${assignments.length !== 1 ? "s" : ""} planned this week`}
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-1 bg-bg-card border border-border rounded-[12px] px-1.5 py-1 self-start sm:self-auto">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-bg-warm transition-colors text-ink-muted hover:text-ink"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-[8px] hover:bg-bg-warm transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" strokeWidth={2} />
            <span className="text-[12px] font-semibold text-ink min-w-[72px] text-center whitespace-nowrap">
              {weekLabel}
            </span>
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-bg-warm transition-colors text-ink-muted hover:text-ink"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchData} />
        </div>
      )}

      {/* Day grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 7 }).map((_, i) => <DayCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {orderedDays.map((day) => (
            <DayCard
              key={day}
              day={day}
              date={weekDates[day]}
              assignments={assignments.filter((a) => a.day === day)}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <RecipePickerAdd
        open={addOpen}
        targetDay={addTarget.day}
        targetMealType={addTarget.mealType}
        recipes={recipes}
        allAssignments={assignments}
        onConfirm={handleAddConfirm}
        onLeftover={handleAddLeftover}
        onClose={() => setAddOpen(false)}
      />
      <RecipePickerEdit
        open={editOpen}
        assignment={editAssignment}
        onConfirm={handleEditConfirm}
        onClose={() => { setEditOpen(false); setEditAssignment(null); }}
      />
    </>
  );
}
