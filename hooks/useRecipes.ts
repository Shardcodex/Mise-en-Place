"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeInput, Ingredient, Step } from "@/lib/types";

export function useRecipes(cookbookId?: string | null) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) { setLoading(false); return; }

    let query = supabase
      .from("recipes")
      .select(`
        *,
        ingredients ( * ),
        steps ( * )
      `)
      .order("created_at", { ascending: false });

    if (cookbookId) {
      // Show all recipes in the cookbook (may include other members' recipes)
      query = query.eq("cookbook_id", cookbookId);
    } else {
      // Fallback: personal recipes with no cookbook
      query = query.eq("user_id", user.user.id).is("cookbook_id", null);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError("Failed to load recipes. Please try again.");
    } else if (data) {
      // Sort ingredients and steps by sort_order
      const sorted = data.map((r: any) => ({
        ...r,
        ingredients: (r.ingredients || []).sort(
          (a: Ingredient, b: Ingredient) => a.sort_order - b.sort_order
        ),
        steps: (r.steps || []).sort(
          (a: Step, b: Step) => a.sort_order - b.sort_order
        ),
      }));
      setRecipes(sorted);
    }
    setLoading(false);
  }, [supabase, cookbookId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  async function createRecipe(input: RecipeInput): Promise<string | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    // Insert recipe
    const { data: recipe, error: recipeErr } = await supabase
      .from("recipes")
      .insert({
        user_id: user.user.id,
        name: input.name,
        emoji: input.emoji,
        servings: input.servings,
        time: input.time,
        tags: input.tags,
        meal_types: input.meal_types ?? [],
        source_url: input.source_url || null,
        photo_path: input.photo_path ?? null,
        photo_focus: input.photo_focus ?? null,
        notes: input.notes || null,
        cookbook_id: input.cookbook_id ?? cookbookId ?? null,
      })
      .select()
      .single();

    if (recipeErr || !recipe) return null;

    // Insert ingredients
    if (input.ingredients.length > 0) {
      const { error: ingErr } = await supabase.from("ingredients").insert(
        input.ingredients.map((ing, i) => ({
          recipe_id: recipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          sort_order: i,
          group_name: ing.group_name ?? null,
        }))
      );
      if (ingErr) console.error("Ingredient insert error:", ingErr);
    }

    // Insert steps
    if (input.steps.length > 0) {
      const { error: stepErr } = await supabase.from("steps").insert(
        input.steps.map((text, i) => ({
          recipe_id: recipe.id,
          text,
          sort_order: i,
        }))
      );
      if (stepErr) console.error("Step insert error:", stepErr);
    }

    await fetchRecipes();
    return recipe.id;
  }

  async function updateRecipe(id: string, input: RecipeInput): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    // Update recipe
    const { error: recipeErr } = await supabase
      .from("recipes")
      .update({
        name: input.name,
        emoji: input.emoji,
        servings: input.servings,
        time: input.time,
        tags: input.tags,
        meal_types: input.meal_types ?? [],
        source_url: input.source_url || null,
        photo_path: input.photo_path ?? null,
        photo_focus: input.photo_focus ?? null,
        notes: input.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (recipeErr) return false;

    // Delete old ingredients and steps, then re-insert
    await supabase.from("ingredients").delete().eq("recipe_id", id);
    await supabase.from("steps").delete().eq("recipe_id", id);

    if (input.ingredients.length > 0) {
      await supabase.from("ingredients").insert(
        input.ingredients.map((ing, i) => ({
          recipe_id: id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          sort_order: i,
          group_name: ing.group_name ?? null,
        }))
      );
    }

    if (input.steps.length > 0) {
      await supabase.from("steps").insert(
        input.steps.map((text, i) => ({
          recipe_id: id,
          text,
          sort_order: i,
        }))
      );
    }

    await fetchRecipes();
    return true;
  }

  async function deleteRecipe(id: string): Promise<boolean> {
    // Cascading deletes handle ingredients, steps, and planner_assignments
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) return false;
    await fetchRecipes();
    return true;
  }

  return { recipes, loading, error, fetchRecipes, createRecipe, updateRecipe, deleteRecipe };
}
