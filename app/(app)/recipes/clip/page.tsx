"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Link as LinkIcon,
  Scissors,
  Loader2,
  Download,
  Clock,
  Users,
  Check,
  Pencil,
  ImageOff,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/layout/Toast";
import { useCookbookContext } from "@/contexts/CookbookContext";
import { smartParseRecipe, parseIngredientLine, parseIngredientStrings } from "@/lib/parser";
import { createClient } from "@/lib/supabase/client";
import RecipeFormModal from "@/components/recipes/RecipeFormModal";
import type { ClippedRecipeData } from "@/app/api/clip/route";
import type { RecipeInput, IngredientInput } from "@/lib/types";

type Stage = "input" | "loading" | "preview" | "saving";

export default function RecipeClipperPage() {
  const router = useRouter();
  const { activeCookbook } = useCookbookContext();
  const { createRecipe, recipes } = useRecipes(activeCookbook?.id);
  const { showToast } = useToast();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [clipped, setClipped] = useState<ClippedRecipeData | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Fetch + parse ──────────────────────────────────────────────────────────

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStage("loading");
    setError("");
    setSourceUrl(url.trim());

    try {
      const res = await fetch(`/api/clip?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not fetch that URL");
      }
      const data = await res.json();
      const recipe: ClippedRecipeData = data.recipe;

      // If we only got raw text (non-structured page), run the heuristic parser
      if (recipe.rawText && recipe.ingredients.length === 0 && recipe.steps.length === 0) {
        const parsed = smartParseRecipe(recipe.rawText);
        recipe.name = recipe.name || parsed.name;
        recipe.ingredients = parsed.ingredients.map((i) =>
          [i.amount, i.unit, i.name].filter(Boolean).join(" ").trim()
        );
        recipe.steps = parsed.steps;
        recipe.servings = recipe.servings ?? parsed.servings ?? null;
        recipe.time = recipe.time || parsed.time || null;
      }

      setClipped(recipe);
      setStage("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg || "Couldn't fetch that URL. Try pasting the recipe text directly using \u201cAdd Recipe\u201d.");
      setStage("input");
    }
  }

  // ── Save recipe ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!clipped) return;
    setStage("saving");

    try {
      // 1. Upload photo if available
      let photoPath: string | null = null;
      if (clipped.imageUrl) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const imgRes = await fetch(`/api/clip/image?url=${encodeURIComponent(clipped.imageUrl)}`);
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
              const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
              const { error: uploadError } = await supabase.storage
                .from("recipe-photos")
                .upload(path, blob, { contentType: blob.type });
              if (!uploadError) {
                photoPath = path;
              }
            }
          }
        } catch {
          // Photo upload failure is non-fatal — continue saving without photo
        }
      }

      // 2. Parse ingredient strings into IngredientInput[] (handles section headers)
      const ingredients: IngredientInput[] = parseIngredientStrings(clipped.ingredients);

      // 3. Add @references to steps
      const stepsWithRefs = clipped.steps.map((step) => {
        let result = step;
        ingredients.forEach((ing) => {
          if (!ing.name || ing.name.length < 3) return;
          const escaped = ing.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const rx = new RegExp("\\b(" + escaped + ")\\b", "i");
          if (rx.test(result) && !result.includes("@" + ing.name)) {
            result = result.replace(rx, "@" + ing.name);
          }
        });
        return result;
      });

      const id = await createRecipe({
        name: clipped.name || "Clipped Recipe",
        emoji: pickEmoji((clipped.name + " " + clipped.ingredients.join(" ")).toLowerCase()),
        servings: clipped.servings ?? 4,
        time: clipped.time ?? "",
        tags: clipped.tags?.slice(0, 8) ?? [],
        source_url: sourceUrl,
        ingredients,
        steps: stepsWithRefs,
        photo_path: photoPath ?? undefined,
      });

      if (id) {
        showToast("Recipe clipped!");
        router.push("/recipes");
      } else {
        throw new Error("Recipe save returned no ID");
      }
    } catch {
      setError("Something went wrong saving the recipe. Please try again.");
      setStage("preview");
    }
  }, [clipped, sourceUrl, supabase, createRecipe, showToast, router]);

  // ── Edit in form ───────────────────────────────────────────────────────────

  const handleEditSave = useCallback(
    async (input: RecipeInput) => {
      const id = await createRecipe({ ...input, source_url: input.source_url || sourceUrl });
      if (id) {
        showToast("Recipe saved!");
        router.push("/recipes");
      }
    },
    [createRecipe, sourceUrl, showToast, router]
  );

  // ── Build a synthetic Recipe object to pre-fill the form ──────────────────
  const formPrefill = clipped
    ? ({
        id: "",
        user_id: "",
        cookbook_id: null,
        name: clipped.name || "Clipped Recipe",
        emoji: pickEmoji((clipped.name + " " + clipped.ingredients.join(" ")).toLowerCase()),
        servings: clipped.servings ?? 4,
        time: clipped.time ?? "",
        tags: clipped.tags?.slice(0, 8) ?? [],
        source_url: sourceUrl,
        notes: "",
        photo_path: null,
        photo_focus: null,
        created_at: "",
        ingredients: parseIngredientStrings(clipped.ingredients)
          .map((i, idx) => ({ ...i, id: String(idx), recipe_id: "", sort_order: idx })),
        steps: clipped.steps.map((text, idx) => ({
          id: String(idx),
          recipe_id: "",
          text,
          sort_order: idx,
        })),
      } as any)
    : null;

  // ── Known ingredient categories for form ──────────────────────────────────
  const knownCategories: Record<string, import("@/lib/types").IngredientCategory> = {};
  recipes.forEach((r) => {
    r.ingredients?.forEach((ing) => {
      if (ing.name) knownCategories[ing.name.toLowerCase()] = ing.category;
    });
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Sub-header */}
      <div className="px-8 py-6 border-b border-[#E5E3DF] bg-[#F7F5F2] no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/recipes"
            className="w-8 h-8 rounded-lg bg-white border-2 border-[#E5E3DF] flex items-center justify-center hover:border-[#444444] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#444444]" strokeWidth={2} />
          </Link>
          <span className="font-sans font-medium text-[12px] tracking-[0.08em] text-[#888888] uppercase">
            {stage === "preview" ? "Recipe Preview" : "Back to Recipes"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Input stage ──────────────────────────────────────────────────── */}
        {(stage === "input" || stage === "loading") && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 py-12">
            <div className="w-full max-w-[560px] text-center">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#E5E3DF] flex items-center justify-center mx-auto mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <Scissors className="w-9 h-9 text-[#E8200F]" strokeWidth={1.5} />
              </div>

              <h1 className="font-display font-bold text-[36px] text-[#0F0F0F] leading-tight mb-3">
                Clip from <em className="italic">the web</em>
              </h1>
              <p className="font-sans font-light text-[16px] text-[#444444] leading-relaxed mb-10 max-w-[400px] mx-auto">
                Paste a recipe URL and we&apos;ll do the rest. You&apos;ll review everything before it&apos;s saved.
              </p>

              <form onSubmit={handleFetch}>
                <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6 text-left">
                  <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-3">
                    Recipe URL
                  </label>
                  <div className="flex items-center gap-3 bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-lg px-4 py-4 mb-4 focus-within:border-[#0F0F0F] transition-colors">
                    <LinkIcon className="w-5 h-5 text-[#888888] shrink-0" strokeWidth={1.5} />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.example.com/recipe/..."
                      required
                      disabled={stage === "loading"}
                      className="flex-1 bg-transparent font-sans font-light text-[15px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger text-left">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={stage === "loading" || !url.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[13px] tracking-[0.06em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
                  >
                    {stage === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Fetching recipe…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" strokeWidth={2} />
                        Fetch Recipe
                      </>
                    )}
                  </button>
                </div>
              </form>

              <span className="font-script text-[18px] text-[#E8200F]">The web is full of good taste</span>
            </div>
          </div>
        )}

        {/* ── Preview stage ────────────────────────────────────────────────── */}
        {(stage === "preview" || stage === "saving") && clipped && (
          <div className="max-w-[720px] mx-auto px-8 py-10">

            {/* Photo */}
            {clipped.imageUrl ? (
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-[#E5E3DF]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={clipped.imageUrl}
                  alt={clipped.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-full aspect-[16/9] rounded-2xl mb-8 bg-[#F7F5F2] border-2 border-dashed border-[#E5E3DF] flex flex-col items-center justify-center gap-2">
                <ImageOff className="w-8 h-8 text-[#CCCCCC]" strokeWidth={1.5} />
                <span className="font-sans text-[12px] text-[#CCCCCC]">No photo found</span>
              </div>
            )}

            {/* Name + meta */}
            <div className="mb-8">
              <h1 className="font-display font-bold text-[32px] text-[#0F0F0F] leading-tight mb-4">
                {clipped.name || "Clipped Recipe"}
              </h1>
              <div className="flex items-center gap-5">
                {clipped.time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#888888]" strokeWidth={2} />
                    <span className="font-sans font-light text-[14px] text-[#444444]">{clipped.time}</span>
                  </div>
                )}
                {clipped.servings && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#888888]" strokeWidth={2} />
                    <span className="font-sans font-light text-[14px] text-[#444444]">
                      {clipped.servings} servings
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients */}
            {clipped.ingredients.length > 0 && (
              <div className="mb-8">
                <h2 className="font-display font-bold text-[20px] text-[#0F0F0F] mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {clipped.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E8200F] mt-[7px] shrink-0" />
                      <span className="font-sans font-light text-[15px] text-[#444444] leading-snug">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {clipped.steps.length > 0 && (
              <div className="mb-10">
                <h2 className="font-display font-bold text-[20px] text-[#0F0F0F] mb-4">Instructions</h2>
                <ol className="space-y-4">
                  {clipped.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-7 h-7 rounded-full bg-[#F7F5F2] border-2 border-[#E5E3DF] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="font-sans font-semibold text-[11px] text-[#444444]">{i + 1}</span>
                      </div>
                      <p className="font-sans font-light text-[15px] text-[#444444] leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Source */}
            {sourceUrl && (
              <p className="font-sans text-[12px] text-[#888888] mb-10">
                Source:{" "}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#444444] break-all">
                  {sourceUrl}
                </a>
              </p>
            )}

            {/* Action buttons */}
            {error && (
              <div className="mb-4 bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={stage === "saving"}
                className="flex-1 flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[14px] tracking-[0.04em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
              >
                {stage === "saving" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Save to Cookbook
                  </>
                )}
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                disabled={stage === "saving"}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0F0F0F] font-sans font-medium text-[14px] tracking-[0.04em] py-3.5 rounded-lg border-2 border-[#E5E3DF] hover:border-[#444444] transition-colors disabled:opacity-50"
              >
                <Pencil className="w-4 h-4" strokeWidth={2} />
                Edit Before Saving
              </button>

              <button
                onClick={() => { setStage("input"); setClipped(null); setError(""); }}
                disabled={stage === "saving"}
                className="sm:w-auto flex items-center justify-center gap-2 bg-white text-[#888888] font-sans font-medium text-[14px] py-3.5 px-5 rounded-lg border-2 border-[#E5E3DF] hover:border-[#444444] hover:text-[#444444] transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={2} />
                Try another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEditModal && formPrefill && (
        <RecipeFormModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
          recipe={formPrefill}
          knownCategories={knownCategories}
        />
      )}
    </>
  );
}

// ── Emoji picker (inline, same as parser) ─────────────────────────────────────

function pickEmoji(text: string): string {
  const rules: [RegExp, string][] = [
    [/pasta|spaghetti|linguine|penne|fettuccin|ziti|lasagna|alfredo|noodle/, "🍝"],
    [/salad|lettuce|greens|arugula|kale/, "🥗"],
    [/soup|stew|chowder|chili|bisque|broth/, "🍲"],
    [/curry|tikka|masala|korma/, "🍛"],
    [/taco|burrito|enchilada|quesadilla|fajita/, "🌮"],
    [/pizza/, "🍕"],
    [/burger|hamburger/, "🍔"],
    [/pancake|waffle|crepe|french toast/, "🥞"],
    [/cake|cupcake|brownie|muffin/, "🍰"],
    [/cookie|biscuit/, "🍪"],
    [/pie|tart|galette/, "🥧"],
    [/bread|sandwich|toast/, "🍞"],
    [/chicken|poultry|turkey/, "🍗"],
    [/steak|beef|meatball/, "🥩"],
    [/fish|salmon|tuna|cod|seafood/, "🐟"],
    [/shrimp|prawn|lobster|crab|dumpling/, "🥟"],
    [/egg|omelette|frittata|quiche/, "🍳"],
    [/rice|fried rice|risotto|quinoa/, "🍚"],
    [/smoothie|shake|juice/, "🥤"],
    [/ice cream|gelato|sorbet/, "🍨"],
    [/potato|mashed|sweet potato/, "🥔"],
    [/ham|bacon|pork/, "🥓"],
  ];
  for (const [rx, em] of rules) {
    if (rx.test(text)) return em;
  }
  return "🍽️";
}
