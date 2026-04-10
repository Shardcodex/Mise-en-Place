"use client";

import { X, Pencil } from "lucide-react";
import type { PlannerAssignment } from "@/lib/types";

interface RecipeChipProps {
  assignment: PlannerAssignment;
  onEdit: (assignment: PlannerAssignment) => void;
  onDelete: (id: string) => void;
}

export default function RecipeChip({
  assignment,
  onEdit,
  onDelete,
}: RecipeChipProps) {
  const recipe = assignment.recipe;
  if (!recipe) return null;

  return (
    <div className="group flex items-center gap-1.5 bg-bg-warm border border-border rounded-[10px] px-2.5 py-1.5 text-[12px] min-w-0">
      {/* Emoji */}
      <span className="text-[14px] leading-none flex-shrink-0">{recipe.emoji}</span>

      {/* Name */}
      <span
        className="font-medium text-ink truncate leading-tight flex-1 cursor-pointer hover:text-accent transition-colors"
        onClick={() => onEdit(assignment)}
        title={recipe.name}
      >
        {recipe.name}
      </span>

      {/* Scale badge — only shown when scale ≠ 1 */}
      {assignment.scale !== 1 && (
        <span className="flex-shrink-0 bg-amber-50 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
          ×{assignment.scale % 1 === 0 ? assignment.scale : assignment.scale}
        </span>
      )}

      {/* Edit icon (appears on hover) */}
      <button
        onClick={() => onEdit(assignment)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-ink-muted hover:text-accent"
        aria-label="Edit assignment"
      >
        <Pencil className="w-3 h-3" strokeWidth={2} />
      </button>

      {/* Delete icon */}
      <button
        onClick={() => onDelete(assignment.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-ink-muted hover:text-danger"
        aria-label="Remove from plan"
      >
        <X className="w-3 h-3" strokeWidth={2.5} />
      </button>
    </div>
  );
}
