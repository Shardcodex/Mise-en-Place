"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Plus, ClipboardPaste, BookOpen } from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/layout/Toast";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeDetailModal from "@/components/recipes/RecipeDetailModal";
import RecipeFormModal from "@/components/recipes/RecipeFormModal";
import PasteImportModal from "@/components/recipes/PasteImportModal";
import type { Recipe, RecipeInput } from "@/lib/types";
import type { ParsedRecipe } from "@/lib/parser";

export default function RecipesPage() {
  const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [parsedForForm, setParsedForForm] = useState<ParsedRecipe | null>(null);

  // Filter recipes by search
  const filtered = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients?.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [recipes, search]);

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
    if (!confirm(`Delete "${selectedRecipe.name}"? This will also remove it from any meal plans.`)) return;
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

  // Build the recipe prop for the form modal (edit or pre-populated from paste)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-bold text-[22px] text-ink mb-1">Recipes</h2>
          <p className="text-[13px] text-ink-muted">
            Your collection of {recipes.length} recipes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="bg-bg-warm border border-border rounded-input pl-9 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted w-48 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-accent text-white rounded-pill px-4 py-2.5 text-[12px] font-semibold hover:-translate-y-[1px] hover:shadow-button transition-all"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add
          </button>
          <button
            onClick={() => setPasteOpen(true)}
            className="flex items-center gap-2 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2.5 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
          >
            <ClipboardPaste className="w-4 h-4" strokeWidth={2} />
            Paste
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-bg-card border border-border rounded-card h-[200px] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-muted">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" strokeWidth={1.5} />
          <p className="text-[16px] font-medium mb-1">
            {search ? "No recipes match your search" : "No recipes yet"}
          </p>
          <p className="text-[13px]">
            {search ? "Try a different search term" : "Click \"Add\" to create your first recipe"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleCardClick(recipe)} />
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
