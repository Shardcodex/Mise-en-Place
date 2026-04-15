"use client";

import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, X, Pencil, CornerDownRight } from "lucide-react";
import { usePlanner } from "@/hooks/usePlanner";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/layout/Toast";
import { useCookbookContext } from "@/contexts/CookbookContext";
import { RecipePickerAdd, RecipePickerEdit } from "@/components/planner/RecipePicker";
import { DayCardSkeleton } from "@/components/ui/Skeleton";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { getOrderedDays, PLANNER_MEALS, MEAL_LABELS } from "@/lib/constants";
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
    return `${first.toLocaleDateString("en-US", { ...opts, year: "numeric" })} \u2013 ${last.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  if (first.getMonth() !== last.getMonth())
    return `${first.toLocaleDateString("en-US", opts)} \u2013 ${last.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  return `${first.toLocaleDateString("en-US", opts)} \u2013 ${last.getDate()}, ${last.getFullYear()}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// ─── Inline cell chip (compact version of RecipeChip for grid cells) ──────────

function CellChip({
  assignment,
  onEdit,
  onDelete,
}: {
  assignment: PlannerAssignment;
  onEdit: (a: PlannerAssignment) => void;
  onDelete: (id: string) => void;
}) {
  const recipe = assignment.recipe;
  if (!recipe) return null;
  const isLeftover = !!assignment.leftover_of_id;

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] mb-1 ${
        isLeftover
          ? "bg-[#F7F5F2] border border-dashed border-[#CCCCCC]"
          : "bg-white border-2 border-[#E5E3DF] hover:border-[#444444]"
      } transition-all cursor-pointer`}
      onClick={() => !isLeftover && onEdit(assignment)}
    >
      {isLeftover && (
        <CornerDownRight className="w-2.5 h-2.5 flex-shrink-0 text-[#888888]" strokeWidth={2} />
      )}
      <span className={`text-[13px] leading-none flex-shrink-0 ${isLeftover ? "opacity-60" : ""}`}>
        {recipe.emoji}
      </span>
      <span
        className={`font-sans font-semibold text-[11px] truncate flex-1 leading-tight ${
          isLeftover ? "text-[#888888]" : "text-[#0F0F0F]"
        }`}
        title={recipe.name}
      >
        {recipe.name}
      </span>
      {isLeftover ? (
        <span className="font-sans font-light text-[9px] italic text-[#888888] flex-shrink-0">
          leftovers
        </span>
      ) : assignment.scale !== 1 ? (
        <span className="flex-shrink-0 bg-amber-50 text-amber-700 text-[9px] font-semibold px-1 py-0.5 rounded-full leading-none">
          &times;{assignment.scale}
        </span>
      ) : null}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(assignment.id); }}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 flex items-center justify-center text-[#888888] hover:text-[#E8200F] ml-0.5"
        aria-label="Remove"
      >
        <X className="w-2.5 h-2.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────

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
  const [weekStartDay, setWeekStartDay] = useState<DayName>("Monday");

  const orderedDays = useMemo(() => getOrderedDays(weekStartDay), [weekStartDay]);
  const weekDates = useMemo(() => getWeekDates(weekOffset, weekStartDay), [weekOffset, weekStartDay]);

  const weekStartDate = useMemo(() => {
    const d = weekDates[weekStartDay];
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${dy}`;
  }, [weekDates, weekStartDay]);

  const { assignments, profile, loading, error, fetchData, addAssignment, addLeftover, updateAssignment, removeAssignment } =
    usePlanner(weekStartDate);
  const { recipes } = useRecipes(activeCookbook?.id);

  useEffect(() => {
    if (profile?.week_start_day) setWeekStartDay(profile.week_start_day as DayName);
  }, [profile?.week_start_day]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    return "Week of";
  }, [weekOffset]);

  const weekRangeStr = useMemo(() => formatWeekRange(weekDates), [weekDates]);

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

  // Total possible slots = 4 meal types × 7 days
  const totalSlots = PLANNER_MEALS.length * 7;
  const filledSlots = assignments.length;

  return (
    <>
      {/* Break out of AppShell's px/py padding */}
      <div className="-mx-4 -my-5 md:-mx-8 md:-my-10 flex flex-col">

        {/* ── Sticky page header ── */}
        <div className="sticky top-0 z-20 bg-[#F7F5F2] px-8 py-5 border-b border-[#E5E3DF] flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#0F0F0F] leading-tight">
              {weekLabel}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-sans font-light text-[13px] text-[#888888]">{weekRangeStr}</p>
              {assignments.length === 0 && !loading && (
                <span className="font-script text-[15px] text-[#888888]">Bon app&eacute;tit</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="flex items-center gap-2 bg-white border border-[#E5E3DF] rounded-lg px-4 py-2 hover:bg-[#F7F5F2] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#444444]" strokeWidth={2} />
              <span className="font-sans font-medium text-[11px] tracking-[0.08em] text-[#444444] uppercase">Prev</span>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="flex items-center gap-2 bg-[#0F0F0F] rounded-lg px-4 py-2 hover:bg-[#444444] transition-colors"
            >
              <span className="font-sans font-medium text-[11px] tracking-[0.08em] text-white uppercase">Today</span>
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex items-center gap-2 bg-white border border-[#E5E3DF] rounded-lg px-4 py-2 hover:bg-[#F7F5F2] transition-colors"
            >
              <span className="font-sans font-medium text-[11px] tracking-[0.08em] text-[#444444] uppercase">Next</span>
              <ArrowRight className="w-4 h-4 text-[#444444]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Stats bar (only when meals are planned) ── */}
        {!loading && filledSlots > 0 && (
          <div className="px-8 py-3 bg-white border-b border-[#E5E3DF] flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[#F7F5F2] rounded-full px-3 py-1.5 border border-[#E5E3DF]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#E8200F]" strokeWidth={2} />
              <span className="font-sans font-medium text-[11px] text-[#0F0F0F]">
                {filledSlots} meal{filledSlots !== 1 ? "s" : ""} planned
              </span>
            </div>
            <span className="font-sans font-light text-[12px] text-[#888888]">
              {totalSlots - filledSlots} slot{totalSlots - filledSlots !== 1 ? "s" : ""} remaining
            </span>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="px-8 py-4">
            <ErrorBanner message={error} onRetry={fetchData} />
          </div>
        )}

        {/* ── Planner grid ── */}
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            {loading ? (
              <div className="grid grid-cols-2 gap-5 p-8">
                {Array.from({ length: 6 }).map((_, i) => <DayCardSkeleton key={i} />)}
              </div>
            ) : (
              <div
                className="grid"
                style={{ gridTemplateColumns: "140px repeat(7, 1fr)" }}
              >
                {/* ── Column headers row ── */}
                {/* Empty corner cell */}
                <div className="bg-[#F7F5F2] border-b border-[#E5E3DF]" />
                {/* Day headers */}
                {orderedDays.map((day, i) => {
                  const date = weekDates[day];
                  const today = isToday(date);
                  return (
                    <div
                      key={day}
                      className={`bg-[#F7F5F2] px-3 py-3 border-b border-[#E5E3DF] ${
                        i > 0 ? "border-l border-[#E5E3DF]" : ""
                      }`}
                    >
                      <div className={`font-sans font-semibold text-[13px] leading-tight ${today ? "text-[#E8200F]" : "text-[#0F0F0F]"}`}>
                        {day}
                      </div>
                      <div className="font-sans font-light text-[11px] text-[#888888] mt-0.5">
                        {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}

                {/* ── Meal-type rows ── */}
                {PLANNER_MEALS.map((meal) => (
                  <Fragment key={meal}>
                    {/* Row label — sticky left */}
                    <div className="sticky left-0 z-10 bg-[#F7F5F2] px-4 py-4 border-b border-[#E5E3DF] flex items-start">
                      <span className="font-sans font-medium text-[10px] tracking-[0.12em] text-[#888888] uppercase">
                        {MEAL_LABELS[meal]}
                      </span>
                    </div>

                    {/* Day cells */}
                    {orderedDays.map((day, i) => {
                      const slotAssignments = assignments.filter(
                        (a) => a.day === day && a.meal_type === meal
                      );
                      const todayCol = isToday(weekDates[day]);

                      return (
                        <div
                          key={day}
                          className={`p-2 border-b border-[#E5E3DF] min-h-[110px] flex flex-col ${
                            i > 0 ? "border-l border-[#E5E3DF]" : ""
                          } ${todayCol ? "bg-[#FFF9F9]" : "bg-white"}`}
                        >
                          {/* Recipe chips */}
                          {slotAssignments.map((a) => (
                            <CellChip
                              key={a.id}
                              assignment={a}
                              onEdit={handleEdit}
                              onDelete={handleDelete}
                            />
                          ))}

                          {/* Add button */}
                          <button
                            onClick={() => handleAdd(day, meal)}
                            className={`mt-auto flex items-center justify-center gap-1.5 w-full rounded-lg border-2 border-dashed transition-all group py-2 ${
                              slotAssignments.length === 0
                                ? "border-[#E5E3DF] hover:border-[#888888] min-h-[64px]"
                                : "border-transparent hover:border-[#E5E3DF]"
                            }`}
                          >
                            <Plus
                              className={`w-3.5 h-3.5 transition-colors ${
                                slotAssignments.length === 0
                                  ? "text-[#E5E3DF] group-hover:text-[#E8200F]"
                                  : "text-[#CCCCCC] group-hover:text-[#888888]"
                              }`}
                              strokeWidth={2.5}
                            />
                            {slotAssignments.length === 0 && (
                              <span className="font-sans font-light text-[10px] text-[#888888] group-hover:text-[#444444] transition-colors">
                                Tap to plan
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
