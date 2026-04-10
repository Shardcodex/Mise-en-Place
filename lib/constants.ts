import type { IngredientCategory, MealType, DayName } from "./types";
import {
  Leaf,
  Milk,
  Beef,
  Croissant,
  Package,
  Snowflake,
  GlassWater,
  HelpCircle,
  Sun,
  Sunset,
  Cookie,
  Coffee,
  Utensils,
  Cake,
  Zap,
  ChefHat,
  UtensilsCrossed,
  Sandwich,
  Archive,
  Droplets,
  Flame,
} from "lucide-react";

export const CATEGORIES: IngredientCategory[] = [
  "Produce",
  "Dairy",
  "Meat & Seafood",
  "Deli",
  "Bakery",
  "Canned Goods",
  "Pantry",
  "Condiments",
  "Spices & Herbs",
  "Frozen",
  "Beverages",
  "Other",
];

export const CATEGORY_ICONS: Record<IngredientCategory, typeof Leaf> = {
  Produce: Leaf,
  Dairy: Milk,
  "Meat & Seafood": Beef,
  Deli: Sandwich,
  Bakery: Croissant,
  "Canned Goods": Archive,
  Pantry: Package,
  Condiments: Droplets,
  "Spices & Herbs": Flame,
  Frozen: Snowflake,
  Beverages: GlassWater,
  Other: HelpCircle,
};

export const CATEGORY_EMOJI: Record<IngredientCategory, string> = {
  Produce: "🥬",
  Dairy: "🧀",
  "Meat & Seafood": "🥩",
  Deli: "🥪",
  Bakery: "🍞",
  "Canned Goods": "🥫",
  Pantry: "🫙",
  Condiments: "🧂",
  "Spices & Herbs": "🌿",
  Frozen: "🧊",
  Beverages: "🥤",
  Other: "📦",
};

/** All meal type categories — used for recipe tagging and filtering. */
export const MEALS: MealType[] = [
  "breakfast",
  "brunch",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "quick-bites",
  "appetizers",
  "sides",
];

/** Subset used for planner day-card slots (keeps the planner compact). */
export const PLANNER_MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  brunch: "Brunch",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  dessert: "Dessert",
  "quick-bites": "Quick Bites",
  appetizers: "Appetizers",
  sides: "Sides",
};

export const MEAL_ICONS: Record<MealType, typeof Sun> = {
  breakfast: Sun,
  brunch: Coffee,
  lunch: Utensils,
  dinner: Sunset,
  snack: Cookie,
  dessert: Cake,
  "quick-bites": Zap,
  appetizers: ChefHat,
  sides: UtensilsCrossed,
};

export const DAYS: DayName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ─── Structured tag vocabulary ───────────────────────────────────────────────

export const CUISINES: string[] = [
  "American", "Southern", "Mexican", "Italian", "French", "Greek",
  "Mediterranean", "Indian", "Chinese", "Japanese", "Korean", "Thai",
  "Vietnamese", "Middle Eastern", "Caribbean", "Irish",
];

export const METHODS: string[] = [
  "Bake", "Stovetop", "Air Fryer", "Grill", "Slow Cooker", "Instant Pot",
  "No-Cook", "Fried", "Roast", "Steam", "Broil",
  "Make-Ahead", "Freezer-Friendly", "One-Pan",
];

export interface TagGroup {
  label: string;
  tags: string[];
}

export const TAG_GROUPS: TagGroup[] = [
  {
    label: "Dietary",
    tags: ["Vegetarian", "Vegan", "Dairy-Free", "Gluten-Free", "Egg-Free"],
  },
  {
    label: "Diet-Friendly",
    tags: ["Keto-Friendly", "Paleo-Friendly", "Low-Carb", "Whole30", "Low-Sodium"],
  },
  {
    label: "Proteins",
    tags: ["Beef", "Pork", "Chicken", "Fish", "Seafood", "Eggs", "Lamb"],
  },
  {
    label: "Character",
    tags: ["Comfort", "Kid-Friendly", "Quick", "Spicy", "Base", "Sauce", "House Staples", "Date Night"],
  },
];

// Flat list of all structured tags (for categorization on edit)
export const ALL_RECIPE_TAGS: string[] = TAG_GROUPS.flatMap((g) => g.tags);

// ─── Tag colors ───────────────────────────────────────────────────────────────

export type TagColorSet = { bg: string; text: string };

const HERB_TAG:   TagColorSet = { bg: "#EAF0EA", text: "#3D5E4B" }; // green  — dietary / diet plans
const BERRY_TAG:  TagColorSet = { bg: "#F0E8EA", text: "#8A4A5A" }; // purple — cuisine
const HONEY_TAG:  TagColorSet = { bg: "#F5EDE0", text: "#9A7A4A" }; // amber  — character / proteins
const OCEAN_TAG:  TagColorSet = { bg: "#E8EFF5", text: "#3A5A7A" }; // blue   — cooking methods

const TAG_COLOR_MAP: Record<string, TagColorSet> = {
  // Cuisine → berry
  ...Object.fromEntries(CUISINES.map((c) => [c, BERRY_TAG])),

  // Methods → ocean
  ...Object.fromEntries(METHODS.map((m) => [m, OCEAN_TAG])),

  // Dietary + Diet-Friendly → herb
  Vegetarian: HERB_TAG, Vegan: HERB_TAG, "Dairy-Free": HERB_TAG,
  "Gluten-Free": HERB_TAG, "Egg-Free": HERB_TAG,
  "Keto-Friendly": HERB_TAG, "Paleo-Friendly": HERB_TAG,
  "Low-Carb": HERB_TAG, Whole30: HERB_TAG, "Low-Sodium": HERB_TAG,

  // Proteins + Character → honey
  Beef: HONEY_TAG, Pork: HONEY_TAG, Chicken: HONEY_TAG, Fish: HONEY_TAG,
  Seafood: HONEY_TAG, Eggs: HONEY_TAG, Lamb: HONEY_TAG,
  Comfort: HONEY_TAG, "Kid-Friendly": HONEY_TAG, Quick: HONEY_TAG,
  Spicy: HONEY_TAG, Base: HONEY_TAG, Sauce: HONEY_TAG,
  "House Staples": HONEY_TAG, "Date Night": HONEY_TAG,
};

export function getTagColors(tag: string): TagColorSet {
  return TAG_COLOR_MAP[tag] ?? HONEY_TAG;
}

// Ordered days starting from a given day
export function getOrderedDays(startDay: DayName): DayName[] {
  const idx = DAYS.indexOf(startDay);
  return [...DAYS.slice(idx), ...DAYS.slice(0, idx)];
}

// Scale presets for the planner picker
export const SCALE_PRESETS = [0.5, 1, 1.5, 2];
