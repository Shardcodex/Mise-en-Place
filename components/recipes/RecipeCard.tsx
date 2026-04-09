import { Clock, Users, List } from "lucide-react";
import Tag from "@/components/ui/Tag";
import RecipePhoto from "@/components/recipes/RecipePhoto";
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
      {/* Photo strip — full width cover, falls back to emoji on warm background */}
      <div className="h-[140px] w-full overflow-hidden relative">
        <RecipePhoto
          photoPath={recipe.photo_path}
          emoji={recipe.emoji}
          cover
        />
        {/* Colored accent bar along the bottom of the photo area */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: topBorderColor }}
        />
        {/* Time badge — top-right */}
        {recipe.time && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Clock className="w-2.5 h-2.5 text-white" strokeWidth={2} />
            <span className="text-[10px] text-white font-medium">{recipe.time}</span>
          </div>
        )}
      </div>

      <div className="p-4 transition-colors duration-300 group-hover:bg-[#FAFAF8]">
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
