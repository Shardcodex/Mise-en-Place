"use client";

/**
 * Full-screen loading overlay that plays the Loading.json Lottie animation.
 * Fades out smoothly once `visible` becomes false.
 */

interface LottieLoaderProps {
  visible: boolean;
}

export default function LottieLoader({ visible }: LottieLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "all" : "none" }}
      aria-hidden={!visible}
    >
      <lottie-player
        src="/Loading.json"
        background="transparent"
        speed="1"
        style={{ width: 200, height: 200 }}
        loop
        autoplay
      />
      <p className="mt-2 text-sm text-ink/50 tracking-wide">Loading…</p>
    </div>
  );
}
