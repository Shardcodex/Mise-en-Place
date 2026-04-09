"use client";

import { useState, useMemo } from "react";
import { Search, Check, ChevronLeft } from "lucide-react";
import Modal, { ModalHeader, ModalFooter } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { DAYS, MEALS, MEAL_LABELS, SCALE_PRESETS } from "@/lib/constants";
import type { Recipe, PlannerAssignment, DayName, MealType } from "@/lib/types";

// ─── Add Mode ────────────────────────────────────────────────────────────────

interface AddModeProps {
  open: boolean;
  targetDay: DayName;
  targetMealType: MealType;
  recipes: Recipe[];
  onConfirm: (
    recipe_id: string,
    day: DayName,
    meal_type: MealType,
    scale: number
  ) => Promise<void>;
  onClose: () => void;
}

export function RecipePickerAdd({
  open,
  targetDay,
  targetMealType,
  recipes,
  onConfirm,
  onClose,
}: AddModeProps) {
  const [step, setStep] = useState<"pick" | "scale">("pick");
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [scale, setScale] = useState(1);
  const [customScale, setCustomScale] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [recipes, search]);

  function handleRecipePick(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setScale(1);
    setCustomScale("");
    setStep("scale");
  }

  function handleBack() {
    setStep("pick");
    setSelectedRecipe(null);
  }

  function handleScalePreset(preset: number) {
    setScale(preset);
    setCustomScale("");
  }

  function handleCustomScaleChange(val: string) {
    setCustomScale(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setScale(num);
    }
  }

  async function handleConfirm() {
    if (!selectedRecipe) return;
    setSaving(true);
    await onConfirm(selectedRecipe.id, targetDay, targetMealType, scale);
    setSaving(false);
    handleClose();
  }

  function handleClose() {
    setStep("pick");
    setSearch("");
    setSelectedRecipe(null);
    setScale(1);
    setCustomScale("");
    onClose();
  }

  const effectiveScale =
    customScale !== "" && !isNaN(parseFloat(customScale)) && parseFloat(customScale) > 0
      ? parseFloat(customScale)
      : scale;

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-[540px]">
      <ModalHeader onClose={handleClose}>
        {step === "pick" ? (
          <div>
            <p className="text-[11px] text-ink-muted font-medium uppercase tracking-wide mb-0.5">
              {MEAL_LABELS[targetMealType]} · {targetDay}
            </p>
            <h3 className="font-bold text-[17px] text-ink">Add a Recipe</h3>
          </div>
        ) : (
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-accent mb-1 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" strokeWidth={2.5} />
              Back
            </button>
            <h3 className="font-bold text-[17px] text-ink">Set Servings Scale</h3>
          </div>
        )}
      </ModalHeader>

      {/* Step: pick a recipe */}
      {step === "pick" && (
        <div className="p-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes…"
              autoFocus
              className="w-full bg-bg-warm border border-border rounded-input pl-9 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Recipe list */}
          {recipes.length === 0 ? (
            <div className="text-center py-8 text-ink-muted text-[13px]">
              No recipes yet — add some in the Recipes tab first.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-ink-muted text-[13px]">
              No recipes match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-1">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleRecipePick(recipe)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-[10px] hover:bg-accent-bg hover:border-accent/30 border border-transparent transition-all group"
                >
                  <span className="text-[22px] leading-none flex-shrink-0">{recipe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate group-hover:text-accent transition-colors">
                      {recipe.name}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {recipe.servings} servings
                      {recipe.time ? ` · ${recipe.time}` : ""}
                    </p>
                  </div>
                  {recipe.tags?.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="hidden sm:inline text-[10px] bg-bg-warm border border-border text-ink-muted px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: pick scale */}
      {step === "scale" && selectedRecipe && (
        <div className="p-6">
          {/* Selected recipe preview */}
          <div className="flex items-center gap-3 bg-bg-warm border border-border rounded-[10px] px-4 py-3 mb-6">
            <span className="text-[28px] leading-none">{selectedRecipe.emoji}</span>
            <div>
              <p className="font-semibold text-[14px] text-ink">{selectedRecipe.name}</p>
              <p className="text-[12px] text-ink-muted">
                Base: {selectedRecipe.servings} servings
              </p>
            </div>
          </div>

          {/* Scale presets */}
          <p className="text-[12px] font-semibold text-ink-light mb-2.5">Scale</p>
          <div className="flex gap-2 mb-3">
            {SCALE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleScalePreset(preset)}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold border transition-all ${
                  scale === preset && customScale === ""
                    ? "bg-accent text-white border-accent shadow-button"
                    : "bg-bg-warm border-border text-ink-light hover:border-accent hover:text-accent"
                }`}
              >
                ×{preset}
              </button>
            ))}
          </div>

          {/* Custom scale input */}
          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-muted font-medium">
                ×
              </span>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={customScale}
                onChange={(e) => handleCustomScaleChange(e.target.value)}
                placeholder="Custom"
                className="w-full bg-bg-warm border border-border rounded-input pl-7 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Result preview */}
          <p className="text-[12px] text-ink-muted mt-3">
            Yields{" "}
            <span className="font-semibold text-ink">
              {+(selectedRecipe.servings * effectiveScale).toFixed(2)} servings
            </span>{" "}
            (base × {effectiveScale})
          </p>
        </div>
      )}

      <ModalFooter>
        <button
          onClick={handleClose}
          className="text-[13px] text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        {step === "scale" && (
          <Button onClick={handleConfirm} loading={saving} disabled={!selectedRecipe}>
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Add to {MEAL_LABELS[targetMealType]}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ─── Edit Mode ────────────────────────────────────────────────────────────────

interface EditModeProps {
  open: boolean;
  assignment: PlannerAssignment | null;
  onConfirm: (
    id: string,
    changes: { scale: number; day: DayName; meal_type: MealType }
  ) => Promise<void>;
  onClose: () => void;
}

export function RecipePickerEdit({
  open,
  assignment,
  onConfirm,
  onClose,
}: EditModeProps) {
  const [scale, setScale] = useState(1);
  const [customScale, setCustomScale] = useState("");
  const [day, setDay] = useState<DayName>("Monday");
  const [mealType, setMealType] = useState<MealType>("dinner");
  const [saving, setSaving] = useState(false);

  // Sync state when assignment changes
  useMemo(() => {
    if (assignment) {
      setScale(assignment.scale);
      setCustomScale(
        SCALE_PRESETS.includes(assignment.scale) ? "" : String(assignment.scale)
      );
      setDay(assignment.day);
      setMealType(assignment.meal_type);
    }
  }, [assignment]);

  const recipe = assignment?.recipe;

  function handleScalePreset(preset: number) {
    setScale(preset);
    setCustomScale("");
  }

  function handleCustomScaleChange(val: string) {
    setCustomScale(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) setScale(num);
  }

  async function handleConfirm() {
    if (!assignment) return;
    const effectiveScale =
      customScale !== "" && !isNaN(parseFloat(customScale)) && parseFloat(customScale) > 0
        ? parseFloat(customScale)
        : scale;
    setSaving(true);
    await onConfirm(assignment.id, { scale: effectiveScale, day, meal_type: mealType });
    setSaving(false);
    onClose();
  }

  const effectiveScale =
    customScale !== "" && !isNaN(parseFloat(customScale)) && parseFloat(customScale) > 0
      ? parseFloat(customScale)
      : scale;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[480px]">
      <ModalHeader onClose={onClose}>
        <h3 className="font-bold text-[17px] text-ink">Edit Meal</h3>
      </ModalHeader>

      <div className="p-6 flex flex-col gap-5">
        {/* Recipe preview */}
        {recipe && (
          <div className="flex items-center gap-3 bg-bg-warm border border-border rounded-[10px] px-4 py-3">
            <span className="text-[28px] leading-none">{recipe.emoji}</span>
            <div>
              <p className="font-semibold text-[14px] text-ink">{recipe.name}</p>
              <p className="text-[12px] text-ink-muted">Base: {recipe.servings} servings</p>
            </div>
          </div>
        )}

        {/* Day + Slot selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide block mb-1.5">
              Day
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayName)}
              className="w-full bg-bg-warm border border-border rounded-input px-3 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent transition-colors"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide block mb-1.5">
              Meal
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full bg-bg-warm border border-border rounded-input px-3 py-2.5 text-[13px] text-ink focus:outline-none focus:border-accent transition-colors"
            >
              {MEALS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide block mb-1.5">
            Scale
          </label>
          <div className="flex gap-2 mb-2">
            {SCALE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleScalePreset(preset)}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold border transition-all ${
                  scale === preset && customScale === ""
                    ? "bg-accent text-white border-accent shadow-button"
                    : "bg-bg-warm border-border text-ink-light hover:border-accent hover:text-accent"
                }`}
              >
                ×{preset}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink-muted font-medium">
              ×
            </span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={customScale}
              onChange={(e) => handleCustomScaleChange(e.target.value)}
              placeholder="Custom"
              className="w-full bg-bg-warm border border-border rounded-input pl-7 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          {recipe && (
            <p className="text-[12px] text-ink-muted mt-2">
              Yields{" "}
              <span className="font-semibold text-ink">
                {+(recipe.servings * effectiveScale).toFixed(2)} servings
              </span>
            </p>
          )}
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="text-[13px] text-ink-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <Button onClick={handleConfirm} loading={saving}>
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          Save Changes
        </Button>
      </ModalFooter>
    </Modal>
  );
}
