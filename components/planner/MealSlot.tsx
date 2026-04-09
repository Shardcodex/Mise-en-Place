"use client";

import { Plus } from "lucide-react";
import { MEAL_ICONS, MEAL_LABELS } from "@/lib/constants";
import RecipeChip from "./RecipeChip";
import type { PlannerAssignment, MealType, DayName } from "@/lib/types";

interface MealSlotProps {
  day: DayName;
  mealType: MealType;
  assignments: PlannerAssignment[];
  onAdd: (day: DayName, mealType: MealType) => void;
  onEdit: (assignment: PlannerAssignment) => void;
  onDelete: (id: string) => void;
}

export default function MealSlot({
  day,
  mealType,
  assignments,
  onAdd,
  onEdit,
  onDelete,
}: MealSlotProps) {
  const Icon = MEAL_ICONS[mealType];
  const label = MEAL_LABELS[mealType];

  return (
    <div className="py-2.5 border-b border-border/60 last:border-b-0">
      {/* Slot header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.75} />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            {label}
          </span>
        </div>

        {/* Add button */}
        <button
          onClick={() => onAdd(day, mealType)}
          className="w-5 h-5 rounded-full bg-bg-warm border border-border flex items-center justify-center hover:border-accent hover:bg-accent-bg transition-colors group"
          aria-label={`Add to ${label}`}
        >
          <Plus className="w-3 h-3 text-ink-muted group-hover:text-accent" strokeWidth={2.5} />
        </button>
      </div>

      {/* Recipe chips */}
      {assignments.length > 0 ? (
        <div className="flex flex-col gap-1">
          {assignments.map((a) => (
            <RecipeChip
              key={a.id}
              assignment={a}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-ink-muted/60 italic pl-0.5">Empty</p>
      )}
    </div>
  );
}
