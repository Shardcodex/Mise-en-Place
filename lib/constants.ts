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
  Sunrise,
  Sunset,
  Cookie,
} from "lucide-react";

export const CATEGORIES: IngredientCategory[] = [
  "Produce",
  "Dairy",
  "Meat & Seafood",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Other",
];

export const CATEGORY_ICONS: Record<IngredientCategory, typeof Leaf> = {
  Produce: Leaf,
  Dairy: Milk,
  "Meat & Seafood": Beef,
  Bakery: Croissant,
  Pantry: Package,
  Frozen: Snowflake,
  Beverages: GlassWater,
  Other: HelpCircle,
};

export const CATEGORY_EMOJI: Record<IngredientCategory, string> = {
  Produce: "🥬",
  Dairy: "🧀",
  "Meat & Seafood": "🥩",
  Bakery: "🍞",
  Pantry: "🫙",
  Frozen: "🧊",
  Beverages: "🥤",
  Other: "📦",
};

export const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const MEAL_ICONS: Record<MealType, typeof Sun> = {
  breakfast: Sun,
  lunch: Sunrise,
  dinner: Sunset,
  snack: Cookie,
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

// Tag color map — matches Mowgli mockup exactly
export type TagColorSet = { bg: string; text: string };

// Herb: dietary/lifestyle tags
const HERB_TAG: TagColorSet = { bg: "#EAF0EA", text: "#3D5E4B" };
// Berry: cuisine tags
const BERRY_TAG: TagColorSet = { bg: "#F0E8EA", text: "#8A4A5A" };
// Honey: character/meal type tags
const HONEY_TAG: TagColorSet = { bg: "#F5EDE0", text: "#9A7A4A" };

const TAG_COLOR_MAP: Record<string, TagColorSet> = {
  // Herb — dietary/lifestyle
  Vegetarian: HERB_TAG,
  Vegan: HERB_TAG,
  "Gluten-free": HERB_TAG,
  "Kid-friendly": HERB_TAG,
  Quick: HERB_TAG,
  "Dairy-free": HERB_TAG,
  "High protein": HERB_TAG,

  // Berry — cuisine
  Italian: BERRY_TAG,
  Mexican: BERRY_TAG,
  Asian: BERRY_TAG,
  Southern: BERRY_TAG,
  Irish: BERRY_TAG,
  American: BERRY_TAG,

  // Honey — character/meal type
  Comfort: HONEY_TAG,
  Breakfast: HONEY_TAG,
  Lunch: HONEY_TAG,
  Dinner: HONEY_TAG,
  Dessert: HONEY_TAG,
  "Side Dish": HONEY_TAG,
  "House Staples": HONEY_TAG,
  Base: HONEY_TAG,
  Starter: HONEY_TAG,
  Sauce: HONEY_TAG,
  Eggs: HONEY_TAG,
  Chicken: HONEY_TAG,
  Beef: HONEY_TAG,
  Pork: HONEY_TAG,
  Sausage: HONEY_TAG,
};

export function getTagColors(tag: string): TagColorSet {
  return TAG_COLOR_MAP[tag] || HONEY_TAG;
}

// Ordered days starting from a given day
export function getOrderedDays(startDay: DayName): DayName[] {
  const idx = DAYS.indexOf(startDay);
  return [...DAYS.slice(idx), ...DAYS.slice(0, idx)];
}

// Scale presets for the planner picker
export const SCALE_PRESETS = [0.5, 1, 1.5, 2];
