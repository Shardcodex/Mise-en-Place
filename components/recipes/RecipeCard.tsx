import { Clock, Users, List } from "lucide-react";
import Tag from "@/components/ui/Tag";
import { getTagColors } from "@/lib/constants";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const primaryTag = recipe.tags?.[0];
  const topBorderColor = primaryTag
    ? getTagColors(primaryTag).text
    : "#5E7E6B";

  return (
    <div
      onClick={onClick}
      className="bg-bg-card border border-border rounded-card overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-[2px] hover:shadow-card"
    >
      {/* Colored top bar */}
      <div className="h-[3px] w-full" style={{ backgroundColor: topBorderColor }} />

      <div className="p-5 transition-colors duration-300 group-hover:bg-[#FAFAF8]">
        {/* Emoji + time */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-full bg-accent-bg flex items-center justify-center text-[22px]">
            {recipe.emoji || "🍽️"}
          </div>
          {recipe.time && (
            <div className="flex items-center gap-1 text-ink-muted">
              <Clock className="w-3 h-3" strokeWidth={2} />
              <span className="text-[11px]">{recipe.time}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-[14px] text-ink mb-2 leading-snug">
          {recipe.name}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-ink-muted">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" strokeWidth={2} />
            <span className="text-[11px]">{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <List className="w-3 h-3" strokeWidth={2} />
            <span className="text-[11px]">{recipe.ingredients.length} items</span>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
