"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, AlertTriangle, Camera, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import RecipePhoto from "@/components/recipes/RecipePhoto";
import { CATEGORIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeInput, IngredientInput, IngredientCategory } from "@/lib/types";

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
  const [tagsStr, setTagsStr] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientInput[]>([emptyIngredient()]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

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
      setTagsStr((recipe.tags || []).join(", "));
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
      setTagsStr("");
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

  // Validate @references
  function findBrokenRefs(): string[] {
    const ingNames = new Set(
      ingredients.filter((i) => i.name.trim()).map((i) => i.name.toLowerCase())
    );
    const broken: string[] = [];
    for (const step of steps) {
      const refs = step.match(/@[\w\s]+?(?=\s|$|,|\.|@)/g) || [];
      for (const ref of refs) {
        const refName = ref.slice(1).trim().toLowerCase();
        if (!ingNames.has(refName) && !broken.includes(ref)) {
          broken.push(ref);
        }
      }
    }
    return broken;
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const brokenRefs = findBrokenRefs();
    setWarnings(brokenRefs);

    // Upload new photo if one was selected
    let finalPhotoPath: string | null = existingPhotoPath;
    if (newPhotoFile) {
      const uploaded = await uploadPhoto(newPhotoFile);
      finalPhotoPath = uploaded;
    }

    const input: RecipeInput = {
      name: name.trim(),
      emoji,
      photo_path: finalPhotoPath,
      servings: parseInt(servings) || 4,
      time: time.trim(),
      tags: tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
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

        {/* Servings, Time, Tags */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          <div className="col-span-2 sm:col-span-1">
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Tags</label>
            <input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="comma-separated"
              className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
            />
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
