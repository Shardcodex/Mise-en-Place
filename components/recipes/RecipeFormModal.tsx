"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, AlertTriangle, Camera, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RecipePhoto from "@/components/recipes/RecipePhoto";
import {
  CATEGORIES, MEALS, MEAL_LABELS, MEAL_ICONS,
  CUISINES, METHODS, TAG_GROUPS, ALL_RECIPE_TAGS,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeInput, IngredientInput, IngredientCategory, MealType } from "@/lib/types";

interface RecipeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (input: RecipeInput) => Promise<void>;
  recipe?: Recipe | null; // null = create mode, Recipe = edit mode
  /** name (lowercase) → category, built from all existing recipes */
  knownCategories?: Record<string, IngredientCategory>;
}

// Kept for the planner/shopping emoji fallback — not shown to the user
const EMOJIS = ["🍝", "🥗", "🍲", "🥘", "🍜", "🍛", "🍳", "🥙", "🍱", "🌮", "🍕", "🥞", "🍰", "🍣", "🥩", "🫕", "🍗", "🥟", "🍔", "🍪"];

const emptyIngredient = (): IngredientInput => ({
  name: "",
  amount: "",
  unit: "",
  category: "Produce" as IngredientCategory,
});

export default function RecipeFormModal({
  open,
  onClose,
  onSave,
  recipe,
  knownCategories,
}: RecipeFormModalProps) {
  const isEdit = !!recipe;
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emoji, setEmoji] = useState("🍽️");
  const [name, setName] = useState("");
  const [servings, setServings] = useState("4");
  const [time, setTime] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [recipeTags, setRecipeTags] = useState<string[]>([]);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Photo state
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (recipe) {
      setEmoji(recipe.emoji || "🍽️");
      setName(recipe.name);
      setServings(String(recipe.servings));
      setTime(recipe.time || "");
      const existingTags = recipe.tags || [];
      const cuisineSet = new Set(CUISINES);
      const methodSet  = new Set(METHODS);
      const tagSet     = new Set(ALL_RECIPE_TAGS);
      setCuisines(existingTags.filter((t) => cuisineSet.has(t)));
      setMethods(existingTags.filter((t) => methodSet.has(t)));
      // Keep structured tags + any unrecognised legacy tags
      setRecipeTags(existingTags.filter((t) => tagSet.has(t) || (!cuisineSet.has(t) && !methodSet.has(t))));
      setMealTypes(recipe.meal_types || []);
      setSourceUrl(recipe.source_url || "");
      setNotes(recipe.notes || "");
      setExistingPhotoPath(recipe.photo_path || null);
      setIngredients(
        recipe.ingredients.map((i) => ({
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          category: i.category,
        }))
      );
      setSteps(recipe.steps.map((s) => s.text));
    } else {
      setEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
      setName("");
      setServings("4");
      setTime("");
      setCuisines([]);
      setMethods([]);
      setRecipeTags([]);
      setMealTypes([]);
      setSourceUrl("");
      setNotes("");
      setExistingPhotoPath(null);
      setIngredients([emptyIngredient()]);
      setSteps([""]);
    }
    // Reset photo upload state whenever modal opens/closes
    setNewPhotoFile(null);
    if (newPhotoPreview) {
      URL.revokeObjectURL(newPhotoPreview);
      setNewPhotoPreview(null);
    }
    setWarnings([]);
    setPhotoError(null);
  }, [recipe, open]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhotoFile(file);
    setNewPhotoPreview(URL.createObjectURL(file));
    // Wipe the old path — it will be replaced on save
    setExistingPhotoPath(null);
    // Reset the input so the same file can be re-selected after removal
    e.target.value = "";
  }

  function handleRemovePhoto() {
    if (newPhotoPreview) URL.revokeObjectURL(newPhotoPreview);
    setNewPhotoFile(null);
    setNewPhotoPreview(null);
    setExistingPhotoPath(null);
  }

  async function uploadPhoto(file: File): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("recipe-photos")
      .upload(path, file, { upsert: false });

    if (error) {
      console.error("Photo upload error:", error);
      return null;
    }
    return path;
  }

  function toggleItem(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function toggleMealType(meal: MealType) {
    setMealTypes((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  }

  function updateIngredient(index: number, field: keyof IngredientInput, value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  /** When the name field loses focus, pre-fill category from known history. */
  function handleIngredientNameBlur(index: number, value: string) {
    if (!knownCategories) return;
    const known = knownCategories[value.toLowerCase().trim()];
    if (known) {
      setIngredients((prev) =>
        prev.map((ing, i) => (i === index ? { ...ing, category: known } : ing))
      );
    }
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  // Validate @references.
  // Uses the same character-scan approach as renderStepText so multi-word names
  // like "@olive oil" are recognised as valid and don't show up as broken.
  function findBrokenRefs(): string[] {
    const sortedNames = ingredients
      .filter((i) => i.name.trim())
      .map((i) => i.name.toLowerCase())
      .sort((a, b) => b.length - a.length); // longest first

    const broken: string[] = [];

    for (const step of steps) {
      let pos = 0;
      while (pos < step.length) {
        const atIdx = step.indexOf("@", pos);
        if (atIdx === -1) break;

        let matched = false;
        for (const name of sortedNames) {
          const end = atIdx + 1 + name.length;
          const candidate = step.slice(atIdx + 1, end).toLowerCase();
          if (candidate === name) {
            const nextChar = step[end];
            if (nextChar === undefined || /[\s,\.!?;@]/.test(nextChar)) {
              pos = end;
              matched = true;
              break;
            }
          }
        }

        if (!matched) {
          const m = step.slice(atIdx).match(/^@\w+/);
          if (m) {
            if (!broken.includes(m[0])) broken.push(m[0]);
            pos = atIdx + m[0].length;
          } else {
            pos = atIdx + 1;
          }
        }
      }
    }

    return broken;
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setPhotoError(null);

    const brokenRefs = findBrokenRefs();
    setWarnings(brokenRefs);

    // Upload new photo if one was selected
    let finalPhotoPath: string | null = existingPhotoPath;
    if (newPhotoFile) {
      const uploaded = await uploadPhoto(newPhotoFile);
      if (uploaded === null) {
        setPhotoError("Photo upload failed — check that the recipe-photos storage bucket exists in Supabase with the correct RLS policies. The recipe will be saved without a photo.");
      }
      finalPhotoPath = uploaded;
    }

    const input: RecipeInput = {
      name: name.trim(),
      emoji,
      photo_path: finalPhotoPath,
      servings: parseInt(servings) || 4,
      time: time.trim(),
      meal_types: mealTypes,
      tags: [...cuisines, ...methods, ...recipeTags],
      source_url: sourceUrl.trim(),
      notes: notes.trim(),
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.filter((s) => s.trim()),
    };

    await onSave(input);
    setSaving(false);
    if (brokenRefs.length === 0) {
      onClose();
    }
  }

  const hasPhoto = !!(newPhotoPreview || existingPhotoPath);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[720px]">
      {/* Header */}
      <div className="sticky top-0 bg-bg-card z-10 px-8 pt-6 pb-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-[18px] text-ink">
          {isEdit ? "Edit Recipe" : "New Recipe"}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center hover:bg-border transition-colors"
        >
          <X className="w-4 h-4 text-ink-light" strokeWidth={2} />
        </button>
      </div>

      {/* Form body */}
      <div className="px-8 py-6 space-y-5">
        {/* Photo upload error */}
        {photoError && (
          <div className="bg-[#FFF0F0] border border-[#F0C8C8] rounded-input p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12px] text-danger leading-relaxed">{photoError}</p>
          </div>
        )}

        {/* Broken reference warnings */}
        {warnings.length > 0 && (
          <div className="bg-[#FFF8EE] border border-[#E8D5B8] rounded-input p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-honey shrink-0 mt-0.5" strokeWidth={2} />
            <div>
              <p className="font-semibold text-[13px] text-honey mb-1">
                Broken ingredient references found
              </p>
              <p className="text-[12px] text-[#8A7A5A] leading-relaxed">
                These @references don&apos;t match any ingredient:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {warnings.map((w) => (
                  <span
                    key={w}
                    className="bg-honey-light text-honey rounded-pill px-2.5 py-0.5 text-[11px] font-medium"
                  >
                    {w}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#8A7A5A] mt-2">
                Recipe saved, but these won&apos;t show quantity details until corrected.
              </p>
            </div>
          </div>
        )}

        {/* Photo + Name */}
        <div className="flex items-start gap-4">
          {/* Photo upload area */}
          <div className="shrink-0">
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Photo</label>
            <div className="relative w-24 h-24 rounded-[14px] overflow-hidden border border-border">
              {newPhotoPreview ? (
                <img
                  src={newPhotoPreview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : existingPhotoPath ? (
                <RecipePhoto
                  photoPath={existingPhotoPath}
                  emoji={emoji}
                  cover
                />
              ) : (
                <div className="w-full h-full bg-[#F0EDE8] flex flex-col items-center justify-center gap-1">
                  <Camera className="w-6 h-6 text-[#B8B2A8]" strokeWidth={1.5} />
                  <span className="text-[10px] text-[#B8B2A8]">Add photo</span>
                </div>
              )}

              {/* Overlay buttons */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                  title="Upload photo"
                >
                  <Camera className="w-3.5 h-3.5 text-ink" strokeWidth={2} />
                </button>
                {hasPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-danger" strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Recipe name */}
          <div className="flex-1 pt-[22px]">
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Recipe Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grandma's Apple Pie"
              className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Servings + Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
              className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Prep Time</label>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 30 minutes"
              className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Cuisine */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">Cuisine</label>
          <div className="flex flex-wrap gap-1.5">
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleItem(cuisines, setCuisines, c)}
                className={`px-3 py-1 rounded-pill text-[11px] font-semibold border transition-all ${
                  cuisines.includes(c)
                    ? "bg-[#8A4A5A] text-white border-[#8A4A5A]"
                    : "bg-bg-warm border-border text-ink-light hover:border-[#8A4A5A] hover:text-[#8A4A5A]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">Method</label>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleItem(methods, setMethods, m)}
                className={`px-3 py-1 rounded-pill text-[11px] font-semibold border transition-all ${
                  methods.includes(m)
                    ? "bg-[#3A5A7A] text-white border-[#3A5A7A]"
                    : "bg-bg-warm border-border text-ink-light hover:border-[#3A5A7A] hover:text-[#3A5A7A]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-2">Tags</label>
          <div className="space-y-3">
            {TAG_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleItem(recipeTags, setRecipeTags, tag)}
                      className={`px-3 py-1 rounded-pill text-[11px] font-semibold border transition-all ${
                        recipeTags.includes(tag)
                          ? "bg-[#9A7A4A] text-white border-[#9A7A4A]"
                          : "bg-bg-warm border-border text-ink-light hover:border-[#9A7A4A] hover:text-[#9A7A4A]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Types */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">Meal Types</label>
          <div className="flex flex-wrap gap-2">
            {MEALS.map((meal) => {
              const Icon = MEAL_ICONS[meal];
              const selected = mealTypes.includes(meal);
              return (
                <button
                  key={meal}
                  type="button"
                  onClick={() => toggleMealType(meal)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-[12px] font-semibold border transition-all ${
                    selected
                      ? "bg-accent text-white border-accent"
                      : "bg-bg-warm border-border text-ink-light hover:border-accent hover:text-accent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {MEAL_LABELS[meal]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">Source URL (optional)</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Substitutions, make-ahead tips, variations…"
            rows={3}
            className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-[12px] text-ink-light">Ingredients</label>
            <button
              onClick={addIngredient}
              className="flex items-center gap-1 text-accent text-[11px] font-semibold hover:text-herb transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              Add ingredient
            </button>
          </div>
          <div className="bg-[#F8F8F5] rounded-input p-4 space-y-2.5">
            {ingredients.length === 0 ? (
              <div className="text-center py-6 text-ink-muted">
                <Plus className="w-6 h-6 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[12px]">Add your first ingredient</p>
              </div>
            ) : (
              ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={ing.amount}
                    onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                    placeholder="Amt"
                    className="w-14 bg-bg-warm border border-border rounded-[10px] px-2 py-1.5 text-[12px] text-ink focus:outline-none focus:border-accent"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    placeholder="Unit"
                    className="w-16 bg-bg-warm border border-border rounded-[10px] px-2 py-1.5 text-[12px] text-ink focus:outline-none focus:border-accent"
                  />
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    onBlur={(e) => handleIngredientNameBlur(i, e.target.value)}
                    placeholder="Ingredient name"
                    className="flex-1 bg-bg-warm border border-border rounded-[10px] px-2 py-1.5 text-[12px] text-ink focus:outline-none focus:border-accent"
                  />
                  <select
                    value={ing.category}
                    onChange={(e) =>
                      updateIngredient(i, "category", e.target.value)
                    }
                    className="w-24 bg-bg-warm border border-border rounded-[10px] px-2 py-1.5 text-[12px] text-ink focus:outline-none focus:border-accent"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(i)}
                    className="text-ink-muted hover:text-danger transition-colors"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-medium text-[12px] text-ink-light">Steps</label>
            <button
              onClick={addStep}
              className="flex items-center gap-1 text-accent text-[11px] font-semibold hover:text-herb transition-colors"
            >
              <Plus className="w-3 h-3" strokeWidth={2.5} />
              Add step
            </button>
          </div>
          <div className="space-y-2.5">
            {steps.length === 0 ? (
              <div className="bg-[#F8F8F5] rounded-input p-6 text-center text-ink-muted">
                <Plus className="w-6 h-6 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[12px]">Add your first step</p>
                <p className="text-[10px] mt-1">
                  Use @ingredientName to cross-reference ingredients
                </p>
              </div>
            ) : (
              steps.map((stepText, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent-bg flex items-center justify-center shrink-0 mt-1.5">
                    <span className="text-[10px] font-semibold text-accent">{i + 1}</span>
                  </div>
                  <textarea
                    value={stepText}
                    onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`Step ${i + 1}... use @ingredient to link`}
                    className="flex-1 bg-bg-warm border border-border rounded-[10px] px-3 py-2 text-[12px] text-ink focus:outline-none focus:border-accent resize-none min-h-[48px]"
                  />
                  <button
                    onClick={() => removeStep(i)}
                    className="text-ink-muted hover:text-danger transition-colors mt-2"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-bg-card border-t border-border px-8 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="bg-transparent border border-border text-ink-light rounded-pill px-5 py-2.5 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-accent text-white rounded-pill px-5 py-2.5 text-[12px] font-semibold hover:-translate-y-[1px] hover:shadow-button transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Recipe"}
        </button>
      </div>
    </Modal>
  );
}
