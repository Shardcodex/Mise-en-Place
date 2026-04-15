"use client";

import { X, Pencil, CornerDownRight } from "lucide-react";
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

  const isLeftover = !!assignment.leftover_of_id;

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12px] min-w-0 ${
        isLeftover
          ? "bg-[#F7F5F2] border border-dashed border-[#CCCCCC]"
          : "bg-bg-warm border border-border"
      }`}
    >
      {/* Leftover indicator icon */}
      {isLeftover && (
        <CornerDownRight
          className="w-3 h-3 flex-shrink-0 text-[#888888]"
          strokeWidth={2}
          aria-hidden="true"
        />
      )}

      {/* Emoji */}
      <span className={`text-[14px] leading-none flex-shrink-0 ${isLeftover ? "opacity-60" : ""}`}>
        {recipe.emoji}
      </span>

      {/* Name */}
      <span
        className={`font-medium truncate leading-tight flex-1 cursor-pointer transition-colors ${
          isLeftover
            ? "text-[#888888] hover:text-[#444444]"
            : "text-ink hover:text-accent"
        }`}
        onClick={() => onEdit(assignment)}
        title={recipe.name}
      >
        {recipe.name}
      </span>

      {/* Leftovers label */}
      {isLeftover && (
        <span className="flex-shrink-0 text-[#888888] text-[10px] font-medium italic leading-none">
          leftovers
        </span>
      )}

      {/* Scale badge — only shown when scale ≠ 1 and not a leftover */}
      {!isLeftover && assignment.scale !== 1 && (
        <span className="flex-shrink-0 bg-amber-50 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
          ×{assignment.scale}
        </span>
      )}

      {/* Edit icon — hidden for leftovers (scale is inherited from source) */}
      {!isLeftover && (
        <button
          onClick={() => onEdit(assignment)}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-ink-muted hover:text-accent"
          aria-label="Edit assignment"
        >
          <Pencil className="w-3 h-3" strokeWidth={2} />
        </button>
      )}

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
