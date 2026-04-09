import { createClient } from "@/lib/supabase/client";
import { SEED_RECIPES } from "@/lib/seed-recipes";

export async function seedRecipesIfEmpty(): Promise<number> {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return 0;

  // Check if user already has recipes
  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.user.id);

  if (count && count > 0) return 0;

  let seeded = 0;

  for (const recipe of SEED_RECIPES) {
    // Insert recipe
    const { data: inserted, error: recipeErr } = await supabase
      .from("recipes")
      .insert({
        user_id: user.user.id,
        name: recipe.name,
        emoji: recipe.emoji,
        servings: recipe.servings,
        time: recipe.time,
        tags: recipe.tags,
        source_url: recipe.source_url || null,
      })
      .select()
      .single();

    if (recipeErr || !inserted) continue;

    // Insert ingredients
    if (recipe.ingredients.length > 0) {
      await supabase.from("ingredients").insert(
        recipe.ingredients.map((ing, i) => ({
          recipe_id: inserted.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          sort_order: i,
        }))
      );
    }

    // Insert steps
    if (recipe.steps.length > 0) {
      await supabase.from("steps").insert(
        recipe.steps.map((text, i) => ({
          recipe_id: inserted.id,
          text,
          sort_order: i,
        }))
      );
    }

    seeded++;
  }

  return seeded;
}
