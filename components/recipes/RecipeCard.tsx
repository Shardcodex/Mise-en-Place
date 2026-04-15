import { Clock, Users } from "lucide-react";
import RecipePhoto from "@/components/recipes/RecipePhoto";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden border-2 border-[#E5E3DF] hover:border-[#444444] transition-all aspect-[4/3.5]">
        {/* Photo */}
        <div className="absolute inset-0">
          <RecipePhoto
            photoPath={recipe.photo_path}
            emoji={recipe.emoji}
            cover
            focus={recipe.photo_focus}
          />
        </div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/20 to-transparent opacity-70" />

        {/* Time badge */}
        {recipe.time && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Clock className="w-2.5 h-2.5 text-white" strokeWidth={2} />
            <span className="font-sans text-[10px] text-white">{recipe.time}</span>
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[18px] leading-none">{recipe.emoji}</span>
            <h3 className="font-display font-bold text-[16px] text-white leading-tight truncate flex-1">
              {recipe.name}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {recipe.time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#888888]" strokeWidth={2} />
                <span className="font-sans font-light text-[11px] text-[#888888]">{recipe.time}</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-[#888888]" strokeWidth={2} />
                <span className="font-sans font-light text-[11px] text-[#888888]">{recipe.servings} servings</span>
              </div>
            )}
          </div>
          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="font-sans text-[10px] text-[#888888] bg-black/40 rounded-full px-2 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
