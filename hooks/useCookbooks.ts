"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Cookbook, CookbookMember } from "@/lib/types";

export function useCookbooks() {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchCookbooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Cookbooks the user owns
    const { data: owned, error: ownedErr } = await supabase
      .from("cookbooks")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    // Cookbooks the user is an accepted member of (but doesn't own)
    const { data: memberOf, error: memberErr } = await supabase
      .from("cookbook_members")
      .select("cookbook_id, cookbooks(*)")
      .eq("user_id", user.id)
      .eq("status", "accepted");

    if (ownedErr || memberErr) {
      setError("Failed to load cookbooks.");
    } else {
      const memberCookbooks = (memberOf ?? [])
        .map((m: any) => m.cookbooks)
        .filter(Boolean)
        .filter((c: Cookbook) => c.owner_id !== user.id); // deduplicate

      const all = [
        ...(owned ?? []),
        ...memberCookbooks,
      ] as Cookbook[];

      // Auto-create "My Cookbook" if user has none and migrate their recipes
      if (all.length === 0) {
        const created = await bootstrapFirstCookbook(user.id);
        if (created) all.push(created);
      }

      setCookbooks(all);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCookbooks();
  }, [fetchCookbooks]);

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  /** Creates "My Cookbook" and migrates un-cookbooked recipes into it. */
  async function bootstrapFirstCookbook(userId: string): Promise<Cookbook | null> {
    const { data: cookbook, error } = await supabase
      .from("cookbooks")
      .insert({ owner_id: userId, name: "My Cookbook" })
      .select()
      .single();

    if (error || !cookbook) return null;

    // Migrate existing personal recipes (no cookbook_id)
    await supabase
      .from("recipes")
      .update({ cookbook_id: cookbook.id })
      .eq("user_id", userId)
      .is("cookbook_id", null);

    return cookbook as Cookbook;
  }

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function createCookbook(name: string, description?: string): Promise<Cookbook | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("cookbooks")
      .insert({ owner_id: user.id, name, description: description ?? null })
      .select()
      .single();

    if (error || !data) return null;
    await fetchCookbooks();
    return data as Cookbook;
  }

  async function renameCookbook(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from("cookbooks")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return false;
    await fetchCookbooks();
    return true;
  }

  async function deleteCookbook(id: string): Promise<boolean> {
    const { error } = await supabase.from("cookbooks").delete().eq("id", id);
    if (error) return false;
    await fetchCookbooks();
    return true;
  }

  // ── Member management ────────────────────────────────────────────────────────

  async function fetchMembers(cookbookId: string): Promise<CookbookMember[]> {
    const { data, error } = await supabase
      .from("cookbook_members")
      .select(`
        *,
        profile:profiles ( display_name )
      `)
      .eq("cookbook_id", cookbookId)
      .order("invited_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as unknown as CookbookMember[];
  }

  /**
   * Create a pending invite record and return the invite URL.
   * The owner shares this link however they like (no email is sent).
   */
  async function inviteMember(cookbookId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("cookbook_members")
      .insert({
        cookbook_id: cookbookId,
        role: "member",
        status: "pending",
      })
      .select("invite_token")
      .single();

    if (error || !data) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invite/${data.invite_token}`;
  }

  async function removeMember(memberId: string): Promise<boolean> {
    const { error } = await supabase
      .from("cookbook_members")
      .delete()
      .eq("id", memberId);
    return !error;
  }

  /**
   * Accept a pending invite by token. Called from the /invite/[token] page.
   * Sets user_id and status to 'accepted' on the matching invite record.
   */
  async function acceptInvite(token: string): Promise<{ success: boolean; cookbookId?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "not_authenticated" };

    // Find the pending invite
    const { data: invite, error: findErr } = await supabase
      .from("cookbook_members")
      .select("id, cookbook_id, status, user_id")
      .eq("invite_token", token)
      .single();

    if (findErr || !invite) return { success: false, error: "invite_not_found" };
    if (invite.status === "accepted") {
      // Already accepted — just send them to the cookbook
      return { success: true, cookbookId: invite.cookbook_id };
    }
    // Check they're not already a member
    if (invite.user_id && invite.user_id !== user.id) {
      return { success: false, error: "invite_claimed" };
    }

    const { error: updateErr } = await supabase
      .from("cookbook_members")
      .update({
        user_id: user.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateErr) return { success: false, error: "update_failed" };
    await fetchCookbooks();
    return { success: true, cookbookId: invite.cookbook_id };
  }

  return {
    cookbooks,
    loading,
    error,
    fetchCookbooks,
    createCookbook,
    renameCookbook,
    deleteCookbook,
    fetchMembers,
    inviteMember,
    removeMember,
    acceptInvite,
  };
}
