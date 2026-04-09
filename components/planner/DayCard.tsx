"use client";

import { MEALS } from "@/lib/constants";
import MealSlot from "./MealSlot";
import type { PlannerAssignment, DayName, MealType } from "@/lib/types";

interface DayCardProps {
  day: DayName;
  date: Date;
  assignments: PlannerAssignment[];
  onAdd: (day: DayName, mealType: MealType) => void;
  onEdit: (assignment: PlannerAssignment) => void;
  onDelete: (id: string) => void;
}

const DAY_ABBREV: Record<DayName, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function DayCard({
  day,
  date,
  assignments,
  onAdd,
  onEdit,
  onDelete,
}: DayCardProps) {
  const today = isToday(date);
  const dayNumber = date.getDate();
  const monthShort = date.toLocaleDateString("en-US", { month: "short" });

  return (
    <div
      className={`bg-bg-card border rounded-card p-4 flex flex-col gap-0 shadow-card transition-all ${
        today ? "border-accent/40 ring-1 ring-accent/20" : "border-border"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-9 h-9 rounded-full flex flex-col items-center justify-center flex-shrink-0 ${
            today
              ? "bg-accent text-white"
              : "bg-bg-warm text-ink"
          }`}
        >
          <span className="text-[9px] font-semibold uppercase leading-none opacity-80">
            {DAY_ABBREV[day]}
          </span>
          <span className="text-[13px] font-bold leading-tight">{dayNumber}</span>
        </div>
        <div>
          <p className={`text-[14px] font-bold leading-tight ${today ? "text-accent" : "text-ink"}`}>
            {day}
          </p>
          <p className="text-[11px] text-ink-muted leading-tight">{monthShort} {dayNumber}</p>
        </div>
        {/* Meal count badge */}
        {assignments.length > 0 && (
          <div className="ml-auto bg-accent-bg text-accent text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {assignments.length} meal{assignments.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Meal slots */}
      <div className="flex flex-col">
        {MEALS.map((meal) => (
          <MealSlot
            key={meal}
            day={day}
            mealType={meal}
            assignments={assignments.filter((a) => a.meal_type === meal)}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
