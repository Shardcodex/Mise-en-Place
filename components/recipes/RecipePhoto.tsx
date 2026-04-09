"use client";

import { useState, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "recipe-photos";
const SIGNED_URL_TTL = 3600; // 1 hour

interface RecipePhotoProps {
  photoPath: string | null;
  emoji?: string;
  /** Cover fill for cards — crops to fill the container */
  cover?: boolean;
  className?: string;
  alt?: string;
}

/**
 * Renders a recipe photo from the private Supabase bucket.
 * Falls back to an emoji or a neutral placeholder icon when no photo exists.
 * Signed URLs are generated client-side on mount.
 */
export default function RecipePhoto({
  photoPath,
  emoji,
  cover = false,
  className = "",
  alt = "",
}: RecipePhotoProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!photoPath) return;
    let cancelled = false;

    supabase.storage
      .from(BUCKET)
      .createSignedUrl(photoPath, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (!cancelled && !error && data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photoPath]); // eslint-disable-line react-hooks/exhaustive-deps

  if (signedUrl) {
    return (
      <img
        src={signedUrl}
        alt={alt}
        className={`${cover ? "w-full h-full object-cover" : ""} ${className}`}
      />
    );
  }

  // Fallback — emoji or placeholder icon
  return (
    <div
      className={`flex items-center justify-center bg-[#F0EDE8] ${cover ? "w-full h-full" : ""} ${className}`}
    >
      {emoji ? (
        <span className="text-[32px] leading-none select-none">{emoji}</span>
      ) : (
        <ImageIcon className="w-8 h-8 text-[#C5BFB6]" strokeWidth={1.5} />
      )}
    </div>
  );
}
