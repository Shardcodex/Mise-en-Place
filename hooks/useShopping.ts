"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/constants";
import type {
  PlannerAssignment,
  ShoppingCheck,
  ShoppingItem,
  IngredientCategory,
} from "@/lib/types";

// ─── Aggregation helper ───────────────────────────────────────────────────────

/**
 * Stem common English plural suffixes from a single word.
 *   "tomatoes" → "tomato"   "berries" → "berry"
 *   "peaches"  → "peach"    "carrots" → "carrot"
 *   "asparagus" → "asparagus"  (us/is/as/ss endings are left alone)
 */
function depluralize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (/(?:oes|xes|ches|shes|sses)$/.test(word) && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3 && !/(us|is|as|ss)$/.test(word)) return word.slice(0, -1);
  return word;
}

/**
 * Normalise an ingredient name into a stable DB key.
 * Strips common plural suffixes so "tomato" and "tomatoes" share a key.
 * e.g. "All-Purpose Flour" → "all_purpose_flour"
 *      "Cherry Tomatoes"   → "cherry_tomato"
 */
function toCheckKey(name: string): string {
  const lower = name.toLowerCase().trim();
  const parts = lower.split(/\s+/);
  parts[parts.length - 1] = depluralize(parts[parts.length - 1]);
  return parts
    .join(" ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Collapse all planner assignments into a flat list of ShoppingItems,
 * merging same-named ingredients across recipes/days.
 */
function aggregateItems(
  assignments: PlannerAssignment[],
  checks: ShoppingCheck[]
): ShoppingItem[] {
  const checkMap = new Map<string, boolean>(
    checks.map((c) => [c.ingredient_key, c.checked])
  );

  // key → ShoppingItem (mutable while building)
  const map = new Map<string, ShoppingItem>();

  // Leftovers slots share ingredients with their source meal — skip them so
  // ingredients aren't double-counted on the shopping list.
  const nonLeftoverAssignments = assignments.filter((a) => !a.leftover_of_id);

  for (const assignment of nonLeftoverAssignments) {
    const recipe = assignment.recipe;
    if (!recipe) continue;

    const sourceRecipe = {
      id: recipe.id,
      emoji: recipe.emoji,
      name: recipe.name,
    };

    for (const ingredient of recipe.ingredients) {
      const check_key = toCheckKey(ingredient.name);

      if (map.has(check_key)) {
        const existing = map.get(check_key)!;

        // Accumulate the amount contribution from this assignment
        existing.amounts.push({
          amount: ingredient.amount,
          unit: ingredient.unit,
          scale: assignment.scale,
        });

        // Add source recipe if not already represented
        if (!existing.source_recipes.some((r) => r.id === recipe.id)) {
          existing.source_recipes.push(sourceRecipe);
        }
      } else {
        map.set(check_key, {
          ingredient_name: ingredient.name,
          category: ingredient.category,
          amounts: [
            {
              amount: ingredient.amount,
              unit: ingredient.unit,
              scale: assignment.scale,
            },
          ],
          source_recipes: [sourceRecipe],
          check_key,
          checked: checkMap.get(check_key) ?? false,
        });
      }
    }
  }

  return Array.from(map.values());
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface GroupedShoppingItems {
  category: IngredientCategory;
  items: ShoppingItem[];
}

export function useShopping() {
  const [assignments, setAssignments] = useState<PlannerAssignment[]>([]);
  const [checks, setChecks] = useState<ShoppingCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [
      { data: assignmentsData, error: assignErr },
      { data: checksData, error: checksErr },
    ] = await Promise.all([
      supabase
        .from("planner_assignments")
        .select(
          `
            *,
            recipe:recipes (
              *,
              ingredients ( * ),
              steps ( * )
            )
          `
        )
        .eq("user_id", user.id),
      supabase
        .from("shopping_checks")
        .select("*")
        .eq("user_id", user.id),
    ]);

    if (assignErr || checksErr) {
      setError("Failed to load shopping list. Please try again.");
    } else {
      if (assignmentsData) setAssignments(assignmentsData);
      if (checksData) setChecks(checksData);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived: aggregated + grouped ─────────────────────────────────────────

  const items = useMemo(
    () => aggregateItems(assignments, checks),
    [assignments, checks]
  );

  /** Items grouped by category, in CATEGORIES display order, empty groups omitted */
  const grouped: GroupedShoppingItems[] = useMemo(() => {
    return CATEGORIES.flatMap((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length === 0) return [];
      return [{ category: cat, items: catItems }];
    });
  }, [items]);

  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);
  const totalCount = items.length;

  // ── Mutations ──────────────────────────────────────────────────────────────

  /**
   * Toggle a single item's checked state (upsert into shopping_checks).
   * Updates local state optimistically to avoid a full re-fetch on every tap.
   */
  async function toggleCheck(check_key: string, checked: boolean): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Optimistic update
    setChecks((prev) => {
      const exists = prev.find((c) => c.ingredient_key === check_key);
      if (exists) {
        return prev.map((c) =>
          c.ingredient_key === check_key ? { ...c, checked } : c
        );
      }
      return [
        ...prev,
        {
          id: check_key, // temporary — will be replaced on next full fetch
          user_id: user.id,
          ingredient_key: check_key,
          checked,
        },
      ];
    });

    const { error } = await supabase.from("shopping_checks").upsert(
      { user_id: user.id, ingredient_key: check_key, checked },
      { onConflict: "user_id,ingredient_key" }
    );

    if (error) {
      console.error("toggleCheck error:", error);
      // Revert on failure
      await fetchData();
    }
  }

  /**
   * Delete all checked items from shopping_checks for this user.
   */
  async function clearChecked(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("shopping_checks")
      .delete()
      .eq("user_id", user.id)
      .eq("checked", true);

    if (error) {
      console.error("clearChecked error:", error);
      return false;
    }

    // Sync local state
    setChecks((prev) => prev.filter((c) => !c.checked));
    return true;
  }

  return {
    grouped,
    items,
    checkedCount,
    totalCount,
    loading,
    error,
    fetchData,
    toggleCheck,
    clearChecked,
  };
}
