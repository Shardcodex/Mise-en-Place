"use client";

import { useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileTabBar from "@/components/layout/MobileTabBar";
import { ToastProvider, useToast } from "@/components/layout/Toast";
import { seedRecipesIfEmpty } from "@/lib/seed";

interface AppShellProps {
  recipeCount: number;
  children: React.ReactNode;
}

function AppShellInner({ recipeCount, children }: AppShellProps) {
  const { showToast } = useToast();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    seedRecipesIfEmpty().then((count) => {
      if (count > 0) {
        showToast(`${count} recipes loaded successfully`);
        // Reload to refresh recipe count in sidebar
        window.location.reload();
      }
    });
  }, [showToast]);

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      <Sidebar recipeCount={recipeCount} />

      <div className="flex-1 flex flex-col min-h-screen md:min-h-0 relative">
        <MobileHeader />

        <main className="flex-1 px-4 py-5 md:px-8 md:py-10 pb-24 md:pb-10 overflow-y-auto">
          {children}
        </main>

        <MobileTabBar />
      </div>
    </div>
  );
}

export default function AppShell({ recipeCount, children }: AppShellProps) {
  return (
    <ToastProvider>
      <AppShellInner recipeCount={recipeCount}>{children}</AppShellInner>
    </ToastProvider>
  );
}
