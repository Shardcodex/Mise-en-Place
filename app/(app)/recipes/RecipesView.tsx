"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Link2, BookOpen } from "lucide-react";
import Link from "next/link";
import { MEALS, MEAL_LABELS, MEAL_ICONS } from "@/lib/constants";
import { useRecipes } from "@/hooks/useRecipes";
import { useCookbookContext } from "@/contexts/CookbookContext";
import { useToast } from "@/components/layout/Toast";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeDetailModal from "@/components/recipes/RecipeDetailModal";
import RecipeFormModal from "@/components/recipes/RecipeFormModal";
import PasteImportModal from "@/components/recipes/PasteImportModal";
import { RecipeCardSkeleton } from "@/components/ui/Skeleton";
import ErrorBanner from "@/components/ui/ErrorBanner";
import type { Recipe, RecipeInput, IngredientCategory, MealType } from "@/lib/types";
import type { ParsedRecipe } from "@/lib/parser";

export default function RecipesView() {
  const { activeCookbook } = useCookbookContext();
  const { recipes, loading, error, fetchRecipes, createRecipe, updateRecipe, deleteRecipe } =
    useRecipes(activeCookbook?.id);
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [parsedForForm, setParsedForForm] = useState<ParsedRecipe | null>(null);

  const filtered = useMemo(() => {
    let result = recipes;
    if (mealTypeFilter) {
      result = result.filter((r) => r.meal_types?.includes(mealTypeFilter));
    }
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients?.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [recipes, search, mealTypeFilter]);

  /** name (lowercase) → most-recently-seen category, for pre-filling the form */
  const knownCategories = useMemo(() => {
    const map: Record<string, IngredientCategory> = {};
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients ?? []) {
        if (ing.name && ing.category) {
          map[ing.name.toLowerCase().trim()] = ing.category;
        }
      }
    }
    return map;
  }, [recipes]);

  function handleCardClick(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setDetailOpen(true);
  }

  function handleAddClick() {
    setEditingRecipe(null);
    setParsedForForm(null);
    setFormOpen(true);
  }

  function handleEditClick() {
    setDetailOpen(false);
    setEditingRecipe(selectedRecipe);
    setParsedForForm(null);
    setFormOpen(true);
  }

  async function handleDeleteClick() {
    if (!selectedRecipe) return;
    if (!confirm(`Delete "${selectedRecipe.name}"? This will also remove it from any meal plans.`))
      return;
    const ok = await deleteRecipe(selectedRecipe.id);
    if (ok) {
      showToast("Recipe deleted");
      setDetailOpen(false);
      setSelectedRecipe(null);
    } else {
      showToast("Failed to delete recipe", "error");
    }
  }

  const handleFormSave = useCallback(
    async (input: RecipeInput) => {
      if (editingRecipe) {
        const ok = await updateRecipe(editingRecipe.id, input);
        if (ok) {
          showToast("Recipe updated");
          setFormOpen(false);
          setEditingRecipe(null);
        } else {
          showToast("Failed to update recipe", "error");
        }
      } else {
        const id = await createRecipe(input);
        if (id) {
          showToast("Recipe created");
          setFormOpen(false);
          setParsedForForm(null);
        } else {
          showToast("Failed to create recipe", "error");
        }
      }
    },
    [editingRecipe, createRecipe, updateRecipe, showToast]
  );

  const handlePasteSave = useCallback(
    async (input: RecipeInput) => {
      const id = await createRecipe(input);
      if (id) {
        showToast("Recipe imported");
      } else {
        showToast("Failed to import recipe", "error");
      }
    },
    [createRecipe, showToast]
  );

  function handlePasteEditInForm(parsed: ParsedRecipe) {
    setPasteOpen(false);
    setParsedForForm(parsed);
    setEditingRecipe(null);
    setFormOpen(true);
  }

  const formRecipe = useMemo(() => {
    if (editingRecipe) return editingRecipe;
    if (parsedForForm) {
      return {
        id: "",
        user_id: "",
        name: parsedForForm.name,
        emoji: parsedForForm.emoji,
        servings: parsedForForm.servings,
        time: parsedForForm.time,
        tags: parsedForForm.tags,
        source_url: null,
        created_at: "",
        updated_at: "",
        ingredients: parsedForForm.ingredients.map((ing, i) => ({
          id: String(i),
          recipe_id: "",
          sort_order: i,
          ...ing,
        })),
        steps: parsedForForm.steps.map((text, i) => ({
          id: String(i),
          recipe_id: "",
          text,
          sort_order: i,
        })),
      } as Recipe;
    }
    return null;
  }, [editingRecipe, parsedForForm]);

  function handleFormClose() {
    setFormOpen(false);
    setEditingRecipe(null);
    setParsedForForm(null);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-[32px] text-[#0F0F0F] mb-6">Recipes</h1>

        {/* Search + tag filter row */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes, ingredients..."
              className="bg-white border-2 border-[#E5E3DF] rounded-lg pl-9 pr-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] w-64 focus:outline-none focus:border-[#0F0F0F] transition-colors"
            />
          </div>
          {/* Tag / meal-type filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setMealTypeFilter(null)}
              className={`font-sans font-medium text-[11px] tracking-[0.06em] px-3.5 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
                !mealTypeFilter
                  ? "bg-[#E8200F] border-[#E8200F] text-white"
                  : "bg-white border-[#E5E3DF] text-[#444444] hover:border-[#444444]"
              }`}
            >
              ALL
            </button>
            {MEALS.map((meal) => {
              const Icon = MEAL_ICONS[meal];
              const active = mealTypeFilter === meal;
              return (
                <button
                  key={meal}
                  onClick={() => setMealTypeFilter(active ? null : meal)}
                  className={`flex items-center gap-1.5 font-sans font-medium text-[11px] tracking-[0.06em] px-3.5 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
                    active
                      ? "bg-[#E8200F] border-[#E8200F] text-white"
                      : "bg-white border-[#E5E3DF] text-[#444444] hover:border-[#444444]"
                  }`}
                >
                  <Icon className="w-3 h-3" strokeWidth={2} />
                  {MEAL_LABELS[meal].toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/recipes/clip"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#0F0F0F] rounded-lg bg-transparent font-sans font-medium text-[12px] tracking-[0.06em] text-[#0F0F0F] hover:bg-[#0F0F0F] hover:text-white transition-colors"
          >
            <Link2 className="w-4 h-4" strokeWidth={2} />
            Clip from Web
          </Link>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#E8200F] rounded-lg font-sans font-medium text-[12px] tracking-[0.06em] text-white hover:bg-[#C41A0C] transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add Recipe
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onRetry={fetchRecipes} />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="font-display italic text-[28px] text-[#444444] text-center mb-3">
            Nothing here yet — but every great meal starts somewhere.
          </p>
          <p className="font-script text-[20px] text-[#888888]">Every journey begins...</p>
          <button
            onClick={handleAddClick}
            className="mt-8 flex items-center gap-2 px-5 py-3 bg-[#E8200F] rounded-lg font-sans font-medium text-[13px] text-white hover:bg-[#C41A0C] transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Add your first recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleCardClick(recipe)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
      <RecipeFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSave={handleFormSave}
        recipe={formRecipe}
        knownCategories={knownCategories}
      />
      <PasteImportModal
        open={pasteOpen}
        onClose={() => setPasteOpen(false)}
        onSave={handlePasteSave}
        onEditInForm={handlePasteEditInForm}
      />
    </>
  );
}
