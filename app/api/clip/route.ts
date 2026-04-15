import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/clip?url=https://...
 *
 * Server-side URL fetcher for the recipe clipper.
 * Fetches the target page, strips HTML noise, and returns plain text
 * so the client-side parser can extract recipe data.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Basic URL validation
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
        // Mimic a real browser so recipe sites don't block the request
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      // 10-second timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Site returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return NextResponse.json(
        { error: "URL does not point to an HTML page" },
        { status: 422 }
      );
    }

    const html = await response.text();

    // ── Strip noise from the HTML ─────────────────────────────────────────────

    // Remove <script>, <style>, <nav>, <footer>, <header>, <aside> blocks
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      // Strip remaining tags
      .replace(/<[^>]+>/g, " ")
      // Collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Cap at 40 000 chars so the parser doesn't choke
    const text = stripped.slice(0, 40_000);

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = msg.includes("timeout") || msg.includes("abort");
    return NextResponse.json(
      { error: isTimeout ? "Request timed out" : "Failed to fetch URL" },
      { status: 502 }
    );
  }
}
