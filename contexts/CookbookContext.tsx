"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useCookbooks } from "@/hooks/useCookbooks";
import type { Cookbook } from "@/lib/types";

interface CookbookContextValue {
  cookbooks: Cookbook[];
  activeCookbook: Cookbook | null;
  setActiveCookbook: (cookbook: Cookbook) => void;
  loading: boolean;
  refreshCookbooks: () => void;
  /** All cookbook mutations from useCookbooks */
  createCookbook: (name: string, description?: string) => Promise<Cookbook | null>;
  renameCookbook: (id: string, name: string) => Promise<boolean>;
  deleteCookbook: (id: string) => Promise<boolean>;
  fetchMembers: ReturnType<typeof useCookbooks>["fetchMembers"];
  inviteMember: ReturnType<typeof useCookbooks>["inviteMember"];
  removeMember: ReturnType<typeof useCookbooks>["removeMember"];
  acceptInvite: ReturnType<typeof useCookbooks>["acceptInvite"];
}

const CookbookContext = createContext<CookbookContextValue | null>(null);

const STORAGE_KEY = "mise_active_cookbook_id";

export function CookbookProvider({ children }: { children: ReactNode }) {
  const {
    cookbooks,
    loading,
    fetchCookbooks,
    createCookbook,
    renameCookbook,
    deleteCookbook,
    fetchMembers,
    inviteMember,
    removeMember,
    acceptInvite,
  } = useCookbooks();

  const [activeCookbook, setActiveCookbookState] = useState<Cookbook | null>(null);

  // Once cookbooks load, restore or default to the first one
  useEffect(() => {
    if (loading || cookbooks.length === 0) return;

    const savedId = typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;

    const saved = savedId ? cookbooks.find((c) => c.id === savedId) : null;
    setActiveCookbookState(saved ?? cookbooks[0]);
  }, [cookbooks, loading]);

  function setActiveCookbook(cookbook: Cookbook) {
    setActiveCookbookState(cookbook);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, cookbook.id);
    }
  }

  return (
    <CookbookContext.Provider
      value={{
        cookbooks,
        activeCookbook,
        setActiveCookbook,
        loading,
        refreshCookbooks: fetchCookbooks,
        createCookbook,
        renameCookbook,
        deleteCookbook,
        fetchMembers,
        inviteMember,
        removeMember,
        acceptInvite,
      }}
    >
      {children}
    </CookbookContext.Provider>
  );
}

export function useCookbookContext() {
  const ctx = useContext(CookbookContext);
  if (!ctx) throw new Error("useCookbookContext must be used inside CookbookProvider");
  return ctx;
}
