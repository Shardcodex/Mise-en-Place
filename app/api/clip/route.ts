import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/clip?url=https://...
 *
 * Server-side URL fetcher for the recipe clipper.
 * 1. Fetches the target page
 * 2. Attempts to parse Schema.org JSON-LD (most reliable)
 * 3. Falls back to og:image for photo + stripped text for legacy parsing
 */

export interface ClippedRecipeData {
  name: string;
  ingredients: string[];   // raw strings, parsed client-side
  steps: string[];
  servings: number | null;
  time: string | null;
  imageUrl: string | null;
  tags: string[];
  /** Only present when JSON-LD is unavailable; client falls back to smartParseRecipe */
  rawText?: string;
}

// ── ISO 8601 duration helpers ─────────────────────────────────────────────────

function parseDurationMins(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return parseInt(m[1] || "0") * 60 + parseInt(m[2] || "0");
}

function parseDuration(iso: string): string {
  const total = parseDurationMins(iso);
  if (total === 0) return iso;
  const h = Math.floor(total / 60);
  const min = total % 60;
  if (h > 0 && min > 0) return `${h}h ${min} min`;
  if (h > 0) return `${h}h`;
  return `${min} min`;
}

// ── JSON-LD helpers ───────────────────────────────────────────────────────────

/**
 * Try to split a single block of instruction text into discrete steps.
 * Handles numbered lists ("1. Preheat…"), line-breaks, and sentence-capital patterns.
 */
function splitStepText(text: string): string[] {
  const t = text.trim();
  if (!t) return [];

  // 1. Numbered patterns: "1. " / "1) " / "Step 1: " / "Step 1. "
  const byNumber = t.split(/\n?\s*(?:Step\s+\d+[.:\s]+|\d+[.)]\s+)/i).map((s) => s.trim()).filter((s) => s.length > 8);
  if (byNumber.length > 1) return byNumber;

  // 2. Double (or more) newlines
  const byDoubleNewline = t.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s.length > 8);
  if (byDoubleNewline.length > 1) return byDoubleNewline;

  // 3. Single newlines (each line is its own step)
  const bySingleNewline = t.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 8);
  if (bySingleNewline.length > 1) return bySingleNewline;

  // 4. Can't split — return as-is
  return [t];
}

/**
 * Recursively extract steps from a recipeInstructions node.
 * Returns a flat string[] where each entry is one discrete step.
 */
function extractSteps(instructions: unknown): string[] {
  // Plain string — try to split it into steps
  if (typeof instructions === "string") {
    return splitStepText(instructions.trim());
  }

  if (!Array.isArray(instructions)) return [];

  const steps: string[] = [];

  for (const node of instructions) {
    if (typeof node === "string") {
      steps.push(...splitStepText(node.trim()));
      continue;
    }
    if (typeof node !== "object" || node === null) continue;

    const obj = node as Record<string, unknown>;

    // HowToSection — recurse into its itemListElement children as individual steps
    if (obj["@type"] === "HowToSection" && Array.isArray(obj.itemListElement)) {
      steps.push(...extractSteps(obj.itemListElement));
      continue;
    }

    // HowToStep or generic object — grab .text then .name
    const raw =
      typeof obj.text === "string"
        ? obj.text.trim()
        : typeof obj.name === "string"
        ? obj.name.trim()
        : "";

    if (raw) steps.push(...splitStepText(raw));
  }

  return steps.filter(Boolean);
}

function extractImageUrl(image: unknown): string | null {
  if (typeof image === "string" && image.startsWith("http")) return image;
  if (Array.isArray(image)) {
    for (const item of image) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
  }
  if (typeof image === "object" && image !== null) {
    const obj = image as Record<string, unknown>;
    if (typeof obj.url === "string" && obj.url.startsWith("http")) return obj.url;
    if (typeof obj.contentUrl === "string") return obj.contentUrl;
  }
  return null;
}

function parseServings(yieldVal: unknown): number | null {
  if (typeof yieldVal === "number") return yieldVal;
  const str = Array.isArray(yieldVal) ? String(yieldVal[0]) : String(yieldVal ?? "");
  const m = str.match(/\d+/);
  return m ? parseInt(m[0]) : null;
}

function parseJsonLd(html: string): ClippedRecipeData | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }

    // Flatten @graph and top-level arrays
    const candidates: unknown[] = [];
    if (Array.isArray(data)) {
      candidates.push(...data);
    } else {
      candidates.push(data);
      if (
        typeof data === "object" &&
        data !== null &&
        "@graph" in data &&
        Array.isArray((data as Record<string, unknown>)["@graph"])
      ) {
        candidates.push(...((data as Record<string, unknown>)["@graph"] as unknown[]));
      }
    }

    for (const item of candidates) {
      if (typeof item !== "object" || item === null) continue;
      const obj = item as Record<string, unknown>;

      const type = obj["@type"];
      const isRecipe =
        type === "Recipe" ||
        (Array.isArray(type) && (type as string[]).includes("Recipe"));
      if (!isRecipe) continue;

      // name
      const name = typeof obj.name === "string" ? obj.name.trim() : "";

      // ingredients
      const ingredients: string[] = Array.isArray(obj.recipeIngredient)
        ? (obj.recipeIngredient as unknown[])
            .filter((i): i is string => typeof i === "string")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // steps — handles arrays, single strings, HowToSection nesting, and plain text blocks
      const steps: string[] = extractSteps(obj.recipeInstructions);

      // servings
      const servings = parseServings(obj.recipeYield);

      // time — prefer totalTime, else prepTime + cookTime
      let time: string | null = null;
      if (typeof obj.totalTime === "string") {
        time = parseDuration(obj.totalTime);
      } else {
        const prepMins = typeof obj.prepTime === "string" ? parseDurationMins(obj.prepTime) : 0;
        const cookMins = typeof obj.cookTime === "string" ? parseDurationMins(obj.cookTime) : 0;
        const total = prepMins + cookMins;
        if (total > 0) {
          const h = Math.floor(total / 60);
          const min = total % 60;
          time = h > 0 && min > 0 ? `${h}h ${min} min` : h > 0 ? `${h}h` : `${min} min`;
        }
      }

      // image
      const imageUrl = extractImageUrl(obj.image);

      // tags / keywords
      const tags: string[] = [];
      if (typeof obj.keywords === "string") {
        tags.push(...obj.keywords.split(",").map((k) => k.trim()).filter(Boolean));
      } else if (Array.isArray(obj.keywords)) {
        tags.push(...(obj.keywords as unknown[]).filter((k): k is string => typeof k === "string"));
      }

      if (name || ingredients.length > 0 || steps.length > 0) {
        return { name, ingredients, steps, servings, time, imageUrl, tags };
      }
    }
  }

  return null;
}

function extractOgImage(html: string): string | null {
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 40_000);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs are supported" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Site returned ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return NextResponse.json({ error: "URL does not point to an HTML page" }, { status: 422 });
    }

    const html = await response.text();

    // 1. Try JSON-LD structured data — most accurate
    const structured = parseJsonLd(html);
    if (structured) {
      // Fill in og:image if JSON-LD didn't have one
      if (!structured.imageUrl) {
        structured.imageUrl = extractOgImage(html);
      }
      return NextResponse.json({ recipe: structured });
    }

    // 2. Fallback: return stripped text for client-side heuristic parsing
    const rawText = stripHtml(html);
    const ogImage = extractOgImage(html);
    const fallback: ClippedRecipeData = {
      name: "",
      ingredients: [],
      steps: [],
      servings: null,
      time: null,
      imageUrl: ogImage,
      tags: [],
      rawText,
    };
    return NextResponse.json({ recipe: fallback });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = msg.includes("timeout") || msg.includes("abort");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out" : "Failed to fetch URL" },
      { status: 502 }
    );
  }
}
