"use client";

import { CookbookProvider } from "@/contexts/CookbookContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <CookbookProvider>{children}</CookbookProvider>;
}
