"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Trash2,
  LogOut,
  Check,
  AlertTriangle,
  ChefHat,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DAYS, CATEGORIES } from "@/lib/constants";
import { seedRecipesIfEmpty } from "@/lib/seed";
import Modal, { ModalHeader, ModalFooter } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/layout/Toast";
import type { DayName, IngredientCategory } from "@/lib/types";

// ─── Types for backup JSON ────────────────────────────────────────────────────

interface BackupIngredient {
  name: string;
  amount: string;
  unit: string;
  category: IngredientCategory;
  sort_order: number;
}

interface BackupStep {
  text: string;
  sort_order: number;
}

interface BackupRecipe {
  id: string; // original DB id — used only for planner remapping during import
  name: string;
  emoji: string;
  servings: number;
  time: string;
  tags: string[];
  source_url: string | null;
  ingredients: BackupIngredient[];
  steps: BackupStep[];
}

interface BackupAssignment {
  recipe_id: string; // original recipe id
  day: DayName;
  meal_type: string;
  scale: number;
}

interface BackupCheck {
  ingredient_key: string;
  checked: boolean;
}

interface BackupFile {
  version: number;
  exported_at: string;
  recipes: BackupRecipe[];
  planner_assignments: BackupAssignment[];
  shopping_checks: BackupCheck[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_DAYS = new Set<string>(DAYS);
const VALID_MEAL_TYPES = new Set(["breakfast", "lunch", "dinner", "snack"]);
const VALID_CATEGORIES = new Set<string>(CATEGORIES);

function validateBackup(data: unknown): { valid: boolean; error?: string } {
  if (typeof data !== "object" || data === null)
    return { valid: false, error: "File is not a valid JSON object." };

  const d = data as Record<string, unknown>;

  if (d.version !== 1)
    return { valid: false, error: "Unsupported backup version." };
  if (!Array.isArray(d.recipes))
    return { valid: false, error: "Missing or invalid recipes array." };
  if (!Array.isArray(d.planner_assignments))
    return { valid: false, error: "Missing planner_assignments array." };
  if (!Array.isArray(d.shopping_checks))
    return { valid: false, error: "Missing shopping_checks array." };

  for (const r of d.recipes as unknown[]) {
    const rec = r as Record<string, unknown>;
    if (typeof rec.name !== "string" || !rec.name)
      return { valid: false, error: "A recipe is missing a name." };
    if (!Array.isArray(rec.ingredients))
      return { valid: false, error: `Recipe "${rec.name}" has invalid ingredients.` };
    if (!Array.isArray(rec.steps))
      return { valid: false, error: `Recipe "${rec.name}" has invalid steps.` };
  }

  for (const a of d.planner_assignments as unknown[]) {
    const asgn = a as Record<string, unknown>;
    if (!VALID_DAYS.has(asgn.day as string))
      return { valid: false, error: `Invalid day in planner: "${asgn.day}".` };
    if (!VALID_MEAL_TYPES.has(asgn.meal_type as string))
      return { valid: false, error: `Invalid meal_type: "${asgn.meal_type}".` };
  }

  return { valid: true };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  danger,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-bg-card rounded-card border p-6 ${
        danger ? "border-danger/30" : "border-border"
      }`}
    >
      <div className="mb-4">
        <h3
          className={`font-bold text-[15px] mb-0.5 ${
            danger ? "text-danger" : "text-ink"
          }`}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[12px] text-ink-muted">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Row inside a section ─────────────────────────────────────────────────────

function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-border/60 last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {hint && <p className="text-[11px] text-ink-muted mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  // Profile state
  const [weekStartDay, setWeekStartDay] = useState<DayName>("Monday");
  const [userEmail, setUserEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  // Reset state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  // Sign out state
  const [signingOut, setSigningOut] = useState(false);

  // ── Load profile ───────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("week_start_day")
        .eq("id", user.id)
        .single();

      if (profile?.week_start_day) {
        setWeekStartDay(profile.week_start_day as DayName);
      }
      setProfileLoading(false);
    }
    loadProfile();
  }, [supabase]);

  // ── 7.2 Week start day ─────────────────────────────────────────────────────

  const handleWeekStartChange = useCallback(
    async (day: DayName) => {
      setWeekStartDay(day);
      setSavingPrefs(true);
      setPrefsSaved(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ week_start_day: day, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setSavingPrefs(false);
      if (!error) {
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 2000);
      } else {
        showToast("Failed to save preference", "error");
      }
    },
    [supabase, showToast]
  );

  // ── 7.3 Export backup ──────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: recipes },
        { data: assignments },
        { data: checks },
      ] = await Promise.all([
        supabase
          .from("recipes")
          .select(`*, ingredients(*), steps(*)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("planner_assignments")
          .select("recipe_id, day, meal_type, scale")
          .eq("user_id", user.id),
        supabase
          .from("shopping_checks")
          .select("ingredient_key, checked")
          .eq("user_id", user.id),
      ]);

      const backup: BackupFile = {
        version: 1,
        exported_at: new Date().toISOString(),
        recipes: (recipes ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          servings: r.servings,
          time: r.time,
          tags: r.tags,
          source_url: r.source_url,
          ingredients: (r.ingredients ?? []).map((ing: any) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category,
            sort_order: ing.sort_order,
          })),
          steps: (r.steps ?? []).map((s: any) => ({
            text: s.text,
            sort_order: s.sort_order,
          })),
        })),
        planner_assignments: (assignments ?? []).map((a: any) => ({
          recipe_id: a.recipe_id,
          day: a.day,
          meal_type: a.meal_type,
          scale: a.scale,
        })),
        shopping_checks: (checks ?? []).map((c: any) => ({
          ingredient_key: c.ingredient_key,
          checked: c.checked,
        })),
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mise-en-place-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("Backup downloaded");
    } catch (err) {
      console.error("Export error:", err);
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  }, [supabase, showToast]);

  // ── 7.4 Import backup ──────────────────────────────────────────────────────

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be re-uploaded if needed
      e.target.value = "";
      setImportError("");
      setImporting(true);

      try {
        const text = await file.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          setImportError("File is not valid JSON.");
          return;
        }

        const { valid, error: validationError } = validateBackup(parsed);
        if (!valid) {
          setImportError(validationError ?? "Invalid backup file.");
          return;
        }

        const backup = parsed as BackupFile;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Step 1: Insert recipes, building old_id → new_id map
        const idMap = new Map<string, string>();

        for (const recipe of backup.recipes) {
          const { data: inserted, error: recipeErr } = await supabase
            .from("recipes")
            .insert({
              user_id: user.id,
              name: recipe.name,
              emoji: recipe.emoji || "🍽️",
              servings: recipe.servings ?? 4,
              time: recipe.time ?? "",
              tags: recipe.tags ?? [],
              source_url: recipe.source_url ?? null,
            })
            .select("id")
            .single();

          if (recipeErr || !inserted) {
            console.error("Import recipe error:", recipeErr);
            continue;
          }

          idMap.set(recipe.id, inserted.id);

          // Insert ingredients
          const ingredients = recipe.ingredients.filter((i) =>
            VALID_CATEGORIES.has(i.category)
          );
          if (ingredients.length > 0) {
            await supabase.from("ingredients").insert(
              ingredients.map((ing, idx) => ({
                recipe_id: inserted.id,
                name: ing.name,
                amount: ing.amount ?? "",
                unit: ing.unit ?? "",
                category: ing.category,
                sort_order: ing.sort_order ?? idx,
              }))
            );
          }

          // Insert steps
          if (recipe.steps.length > 0) {
            await supabase.from("steps").insert(
              recipe.steps.map((step, idx) => ({
                recipe_id: inserted.id,
                text: step.text,
                sort_order: step.sort_order ?? idx,
              }))
            );
          }
        }

        // Step 2: Insert planner assignments (remap recipe_id)
        const validAssignments = backup.planner_assignments.filter(
          (a) =>
            idMap.has(a.recipe_id) &&
            VALID_DAYS.has(a.day) &&
            VALID_MEAL_TYPES.has(a.meal_type)
        );

        if (validAssignments.length > 0) {
          await supabase.from("planner_assignments").insert(
            validAssignments.map((a) => ({
              user_id: user.id,
              recipe_id: idMap.get(a.recipe_id)!,
              day: a.day,
              meal_type: a.meal_type,
              scale: a.scale ?? 1,
            }))
          );
        }

        // Step 3: Upsert shopping checks
        if (backup.shopping_checks.length > 0) {
          await supabase.from("shopping_checks").upsert(
            backup.shopping_checks.map((c) => ({
              user_id: user.id,
              ingredient_key: c.ingredient_key,
              checked: c.checked,
            })),
            { onConflict: "user_id,ingredient_key" }
          );
        }

        showToast(
          `Imported ${backup.recipes.length} recipe${backup.recipes.length !== 1 ? "s" : ""}`
        );
      } catch (err) {
        console.error("Import error:", err);
        setImportError("Unexpected error during import.");
      } finally {
        setImporting(false);
      }
    },
    [supabase, showToast]
  );

  // ── 7.5 Reset all data ─────────────────────────────────────────────────────

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Delete in dependency order; recipes cascade to ingredients + steps
      await supabase
        .from("planner_assignments")
        .delete()
        .eq("user_id", user.id);
      await supabase
        .from("shopping_checks")
        .delete()
        .eq("user_id", user.id);
      await supabase
        .from("recipes")
        .delete()
        .eq("user_id", user.id);

      // Re-seed the 37 starter recipes
      const seeded = await seedRecipesIfEmpty();

      setResetOpen(false);
      setResetConfirmText("");
      showToast(
        seeded > 0
          ? `Reset complete — ${seeded} recipes restored`
          : "All data cleared"
      );

      // Reload page so layout re-fetches recipe count
      router.refresh();
    } catch (err) {
      console.error("Reset error:", err);
      showToast("Reset failed", "error");
    } finally {
      setResetting(false);
    }
  }, [supabase, showToast, router]);

  // ── 7.6 Sign out ───────────────────────────────────────────────────────────

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h2 className="font-bold text-[22px] text-ink mb-1">Settings</h2>
        <p className="text-[13px] text-ink-muted">
          Preferences, data management and account
        </p>
      </div>

      <div className="max-w-[640px] flex flex-col gap-5">

        {/* ── Preferences ─────────────────────────────────────────────── */}
        <Section
          title="Preferences"
          description="Personalise how the app works for you"
        >
          <SettingsRow
            label="Week starts on"
            hint="Changes which day appears first in the Planner"
          >
            {profileLoading ? (
              <div className="w-32 h-9 bg-bg-warm rounded-input animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={weekStartDay}
                  onChange={(e) =>
                    handleWeekStartChange(e.target.value as DayName)
                  }
                  className="bg-bg-warm border border-border rounded-input px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-accent transition-colors min-w-[130px]"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                {/* Inline save indicator */}
                <div className="w-5 h-5 flex items-center justify-center">
                  {savingPrefs && (
                    <Loader2 className="w-4 h-4 text-ink-muted animate-spin" />
                  )}
                  {prefsSaved && !savingPrefs && (
                    <Check className="w-4 h-4 text-accent" strokeWidth={2.5} />
                  )}
                </div>
              </div>
            )}
          </SettingsRow>
        </Section>

        {/* ── Data Management ──────────────────────────────────────────── */}
        <Section
          title="Data"
          description="Export a backup or import previously saved data"
        >
          {/* Export */}
          <SettingsRow
            label="Export backup"
            hint="Download all your recipes, planner and shopping data as JSON"
          >
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {exporting ? "Exporting…" : "Export"}
            </button>
          </SettingsRow>

          {/* Import */}
          <SettingsRow
            label="Import backup"
            hint="Merge recipes and planner data from a previously exported file"
          >
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2 text-[12px] font-semibold hover:border-accent hover:text-accent transition-all disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                )}
                {importing ? "Importing…" : "Import"}
              </button>

              {importError && (
                <p className="text-[11px] text-danger text-right max-w-[220px]">
                  {importError}
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </SettingsRow>
        </Section>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <Section
          title="Danger Zone"
          description="Irreversible actions — proceed with caution"
          danger
        >
          <SettingsRow
            label="Reset all data"
            hint="Delete everything and restore the 37 starter recipes"
          >
            <button
              onClick={() => {
                setResetConfirmText("");
                setResetOpen(true);
              }}
              className="flex items-center gap-1.5 bg-transparent border border-danger/40 text-danger rounded-pill px-4 py-2 text-[12px] font-semibold hover:bg-danger-bg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Reset
            </button>
          </SettingsRow>
        </Section>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <Section title="Account">
          <SettingsRow
            label={userEmail || "Signed in"}
            hint="Your account email"
          >
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 bg-transparent border border-border text-ink-light rounded-pill px-4 py-2 text-[12px] font-semibold hover:border-danger hover:text-danger transition-all disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              )}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </SettingsRow>
        </Section>

      </div>

      {/* ── Reset confirmation modal ────────────────────────────────────── */}
      <Modal open={resetOpen} onClose={() => !resetting && setResetOpen(false)} maxWidth="max-w-[440px]">
        <ModalHeader onClose={() => !resetting && setResetOpen(false)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-danger-bg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-danger" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-[17px] text-ink">Reset All Data</h3>
          </div>
        </ModalHeader>

        <div className="px-8 py-6 flex flex-col gap-4">
          {/* Warning box */}
          <div className="bg-danger-bg border border-danger/20 rounded-[10px] px-4 py-3">
            <p className="text-[12px] text-danger font-medium mb-1">
              This will permanently delete:
            </p>
            <ul className="text-[12px] text-danger/80 space-y-0.5 pl-3 list-disc">
              <li>All your recipes (and their ingredients + steps)</li>
              <li>Your entire meal plan</li>
              <li>Your shopping list checks</li>
            </ul>
            <p className="text-[12px] text-danger font-medium mt-2">
              The 37 starter recipes will be restored. This cannot be undone.
            </p>
          </div>

          {/* Confirmation input */}
          <div>
            <label className="block text-[12px] font-semibold text-ink-light mb-1.5">
              Type <span className="font-bold text-ink">RESET</span> to confirm
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET"
              autoComplete="off"
              className="w-full bg-bg-warm border border-border rounded-input px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-danger transition-colors font-mono"
            />
          </div>

          {/* Preview of what will be restored */}
          <div className="flex items-center gap-2 text-[12px] text-ink-muted">
            <ChefHat className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
            <span>37 starter recipes will be automatically restored</span>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setResetOpen(false)}
            disabled={resetting}
            className="text-[13px] text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <Button
            variant="danger"
            onClick={handleReset}
            loading={resetting}
            disabled={resetConfirmText !== "RESET"}
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            Reset Everything
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
