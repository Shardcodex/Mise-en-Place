export type IngredientCategory =
  | "Produce"
  | "Dairy"
  | "Meat & Seafood"
  | "Bakery"
  | "Pantry"
  | "Frozen"
  | "Beverages"
  | "Other";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type DayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: string;
  unit: string;
  category: IngredientCategory;
  sort_order: number;
}

export interface Step {
  id: string;
  recipe_id: string;
  text: string;
  sort_order: number;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  servings: number;
  time: string;
  tags: string[];
  source_url: string | null;
  created_at: string;
  updated_at: string;
  ingredients: Ingredient[];
  steps: Step[];
}

export interface PlannerAssignment {
  id: string;
  user_id: string;
  recipe_id: string;
  day: DayName;
  meal_type: MealType;
  scale: number;
  created_at: string;
  recipe?: Recipe;
}

export interface ShoppingCheck {
  id: string;
  user_id: string;
  ingredient_key: string;
  checked: boolean;
}

export interface Profile {
  id: string;
  display_name: string;
  week_start_day: DayName;
  created_at: string;
  updated_at: string;
}

// Form types (for create/edit, before DB insertion)
export interface IngredientInput {
  name: string;
  amount: string;
  unit: string;
  category: IngredientCategory;
}

export interface RecipeInput {
  name: string;
  emoji: string;
  servings: number;
  time: string;
  tags: string[];
  source_url: string;
  ingredients: IngredientInput[];
  steps: string[];
}

// Aggregated shopping item (derived, not stored)
export interface ShoppingItem {
  ingredient_name: string;
  category: IngredientCategory;
  amounts: { amount: string; unit: string; scale: number }[];
  source_recipes: { id: string; emoji: string; name: string }[];
  check_key: string;
  checked: boolean;
}
