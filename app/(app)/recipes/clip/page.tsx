"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link as LinkIcon, Scissors, Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRecipes } from "@/hooks/useRecipes";
import { useToast } from "@/components/layout/Toast";
import { useCookbookContext } from "@/contexts/CookbookContext";
import { smartParseRecipe } from "@/lib/parser";

export default function RecipeClipperPage() {
  const router = useRouter();
  const { activeCookbook } = useCookbookContext();
  const { createRecipe } = useRecipes(activeCookbook?.id);
  const { showToast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      // Attempt to fetch via a server action or API route
      const res = await fetch(`/api/clip?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) throw new Error("Could not fetch that URL");
      const { text } = await res.json();
      const parsed = smartParseRecipe(text);
      const id = await createRecipe({
        name: parsed.name || "Clipped Recipe",
        emoji: parsed.emoji || "📋",
        servings: parsed.servings,
        time: parsed.time,
        tags: parsed.tags,
        source_url: url.trim(),
        ingredients: parsed.ingredients,
        steps: parsed.steps,
      });
      if (id) {
        showToast("Recipe clipped!");
        router.push("/recipes");
      }
    } catch {
      setError("Couldn't fetch that URL. Try pasting the recipe text directly using \u201cAdd Recipe\u201d.");
    } finally {
      setLoading(false);
    }
  }

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
            Back to Recipes
          </span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-[560px] text-center">
          {/* Icon */}
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
                  className="flex-1 bg-transparent font-sans font-light text-[15px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none"
                />
              </div>

              {error && (
                <div className="mb-4 bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger text-left">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[13px] tracking-[0.06em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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
    </>
  );
}
