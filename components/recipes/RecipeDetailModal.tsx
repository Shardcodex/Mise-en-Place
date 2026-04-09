"use client";

import { useMemo } from "react";
import {
  X, Users, Clock, Link as LinkIcon, ShoppingBasket, ListOrdered,
  Pencil, Printer, Trash2, AlertTriangle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Tag from "@/components/ui/Tag";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { Recipe, Ingredient, IngredientCategory } from "@/lib/types";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function RecipeDetailModal({
  recipe,
  open,
  onClose,
  onEdit,
  onDelete,
}: RecipeDetailModalProps) {
  // Group ingredients by category
  const grouped = useMemo(() => {
    if (!recipe) return [];
    const map = new Map<string, Ingredient[]>();
    for (const ing of recipe.ingredients) {
      const cat = ing.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ing);
    }
    return Array.from(map.entries()).map(([category, items]) => ({
      category: category as IngredientCategory,
      items,
    }));
  }, [recipe]);

  // Build a set of ingredient names for @reference validation
  const ingredientNames = useMemo(() => {
    if (!recipe) return new Set<string>();
    return new Set(recipe.ingredients.map((i) => i.name.toLowerCase()));
  }, [recipe]);

  // Find ingredient by name (for tooltip)
  function findIngredient(name: string): Ingredient | undefined {
    return recipe?.ingredients.find(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Render step text with @ingredient chips
  function renderStepText(text: string) {
    const parts = text.split(/(@[\w\s]+?)(?=\s|$|,|\.|@)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const name = part.slice(1).trim();
        const ing = findIngredient(name);
        const isValid = !!ing;
        return (
          <span
            key={i}
            className={`inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[12px] font-medium mx-0.5 ${
              isValid
                ? "bg-accent-bg text-herb cursor-pointer hover:bg-[#d5e5d5] transition-colors"
                : "bg-danger-bg text-danger cursor-help"
            }`}
            title={
              isValid
                ? `${ing!.amount} ${ing!.unit} ${ing!.name}`
                : "Broken reference — ingredient not found"
            }
          >
            {name}
            {!isValid && <AlertTriangle className="w-3 h-3 ml-1" strokeWidth={2} />}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  if (!recipe) return null;

  const sourceHost = recipe.source_url
    ? (() => {
        try {
          return new URL(recipe.source_url).hostname.replace("www.", "");
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <Modal open={open} onClose={onClose}>
      {/* Sticky header */}
      <div className="sticky top-0 bg-bg-card z-10 px-8 pt-6 pb-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center flex-1">
            <div className="w-16 h-16 rounded-full bg-accent-bg flex items-center justify-center text-[32px] mb-3 shadow-sm">
              {recipe.emoji || "🍽️"}
            </div>
            <h2 className="font-bold text-[20px] text-ink text-center">
              {recipe.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center hover:bg-border transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-ink-light" strokeWidth={2} />
          </button>
        </div>

        {/* Meta bar */}
        <div className="flex items-center justify-center gap-5 mt-3 text-ink-muted">
          {recipe.servings && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="text-[12px]">{recipe.servings} servings</span>
            </div>
          )}
          {recipe.time && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="text-[12px]">{recipe.time}</span>
            </div>
          )}
          {sourceHost && (
            <a
              href={recipe.source_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-accent transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="text-[12px] text-accent">{sourceHost}</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {recipe.tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        {/* Ingredients */}
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBasket className="w-4 h-4 text-herb" strokeWidth={2} />
          <h3 className="font-semibold text-[13px] text-herb uppercase tracking-[0.04em]">
            Ingredients
          </h3>
        </div>
        {grouped.map(({ category, items }) => {
          const Icon = CATEGORY_ICONS[category];
          return (
            <div key={category} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                <span className="font-medium text-[12px] text-accent">{category}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 bg-[#F8F8F5] rounded-input p-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-[13px] text-ink-light shrink-0">
                      {item.amount} {item.unit}
                    </span>
                    <span className="text-[13px] text-ink">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <ListOrdered className="w-4 h-4 text-herb" strokeWidth={2} />
              <h3 className="font-semibold text-[13px] text-herb uppercase tracking-[0.04em]">
                Steps
              </h3>
            </div>
            <div className="space-y-4">
              {recipe.steps.map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent-bg flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[11px] font-semibold text-accent">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-[14px] text-ink leading-relaxed">
                    {renderStepText(step.text)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-bg-card border-t border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 bg-accent text-white rounded-pill px-4 py-2 text-[12px] font-semibold hover:-translate-y-[1px] transition-all"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
            Edit Recipe
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={2} />
            Print
          </button>
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-danger hover:bg-danger-bg rounded-pill px-4 py-2 text-[12px] font-semibold transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          Delete
        </button>
      </div>
    </Modal>
  );
}
