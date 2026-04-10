"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "recipe-photos";
const SIGNED_URL_TTL = 3600; // 1 hour (seconds)
const CACHE_REFRESH_BUFFER_MS = 120_000; // re-fetch 2 min before expiry

// ─── Size presets ─────────────────────────────────────────────────────────────
// "thumb" — recipe cards and small previews (displayed ≤ 300 px wide, 2× for retina)
// "full"  — detail modal banner (displayed ≤ 720 px wide, 2× for retina)
export type PhotoSize = "thumb" | "full";

const TRANSFORM_WIDTH: Record<PhotoSize, number> = {
  thumb: 480,
  full: 960,
};

// ─── Module-level signed-URL cache ───────────────────────────────────────────
// Persists across re-renders and is shared by every RecipePhoto on the page,
// so 20 cards showing the same photo only ever fire one createSignedUrl call.
interface CachedUrl {
  url: string;
  expiresAt: number; // ms since epoch
}
const urlCache = new Map<string, CachedUrl>();

async function resolveSignedUrl(
  supabase: ReturnType<typeof createClient>,
  photoPath: string,
  size: PhotoSize
): Promise<string | null> {
  const cacheKey = `${photoPath}::${size}`;
  const cached = urlCache.get(cacheKey);

  // Return cached URL if it still has more than CACHE_REFRESH_BUFFER_MS left
  if (cached && cached.expiresAt - Date.now() > CACHE_REFRESH_BUFFER_MS) {
    return cached.url;
  }

  const width = TRANSFORM_WIDTH[size];

  // Try with image transformation first (Supabase Pro feature — resizes + compresses)
  let signedUrl: string | null = null;
  const transformResult = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(photoPath, SIGNED_URL_TTL, {
      transform: { width, resize: "cover", quality: 80 },
    });

  if (!transformResult.error && transformResult.data?.signedUrl) {
    signedUrl = transformResult.data.signedUrl;
  } else {
    // Transforms not available (free plan) — fall back to full-size signed URL
    const fallbackResult = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(photoPath, SIGNED_URL_TTL);
    if (!fallbackResult.error && fallbackResult.data?.signedUrl) {
      signedUrl = fallbackResult.data.signedUrl;
    }
  }

  if (!signedUrl) return null;

  urlCache.set(cacheKey, {
    url: signedUrl,
    expiresAt: Date.now() + SIGNED_URL_TTL * 1000,
  });

  return signedUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecipePhotoProps {
  photoPath: string | null;
  emoji?: string;
  /** Cover-fill the container (object-cover). Default: false. */
  cover?: boolean;
  /**
   * Controls the requested image dimensions:
   * - "thumb" (default) — 480 px wide, for cards and small previews
   * - "full"            — 960 px wide, for the detail modal banner
   */
  size?: PhotoSize;
  className?: string;
  alt?: string;
}

export default function RecipePhoto({
  photoPath,
  emoji,
  cover = false,
  size = "thumb",
  className = "",
  alt = "",
}: RecipePhotoProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!photoPath) return;
    let cancelled = false;

    resolveSignedUrl(supabase, photoPath, size).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [photoPath, size]); // eslint-disable-line react-hooks/exhaustive-deps

  if (signedUrl) {
    return (
      <img
        src={signedUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${cover ? "w-full h-full object-cover" : ""} ${className}`}
      />
    );
  }

  // Fallback — emoji or neutral placeholder
  return (
    <div
      className={`flex items-center justify-center bg-[#F0EDE8] ${
        cover ? "w-full h-full" : ""
      } ${className}`}
    >
      {emoji ? (
        <span className="text-[32px] leading-none select-none">{emoji}</span>
      ) : (
        <ImageIcon className="w-8 h-8 text-[#C5BFB6]" strokeWidth={1.5} />
      )}
    </div>
  );
}
