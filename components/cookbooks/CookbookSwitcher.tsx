"use client";

import { useState } from "react";
import { ChevronDown, Plus, Settings, BookOpen, Check } from "lucide-react";
import { useCookbookContext } from "@/contexts/CookbookContext";
import { createClient } from "@/lib/supabase/client";
import CookbookSettingsModal from "./CookbookSettingsModal";
import type { Cookbook } from "@/lib/types";

export default function CookbookSwitcher() {
  const { cookbooks, activeCookbook, setActiveCookbook, createCookbook } =
    useCookbookContext();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  // Lazy-fetch the user ID for ownership checks
  async function ensureUserId(): Promise<string | null> {
    if (userId) return userId;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    return user?.id ?? null;
  }

  async function handleOpenDropdown() {
    await ensureUserId();
    setOpen((v) => !v);
  }

  async function handleCreateCookbook() {
    if (!newName.trim()) return;
    const cookbook = await createCookbook(newName.trim());
    if (cookbook) {
      setActiveCookbook(cookbook);
      setNewName("");
      setCreating(false);
      setOpen(false);
    }
  }

  if (!activeCookbook) return null;

  const isOwner = activeCookbook.owner_id === userId;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        onClick={handleOpenDropdown}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] hover:bg-[#F5F5F2] transition-colors group"
      >
        <div className="w-7 h-7 rounded-[8px] bg-accent-bg flex items-center justify-center shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] font-semibold text-ink truncate">{activeCookbook.name}</p>
          <p className="text-[9px] text-ink-muted">
            {cookbooks.length === 1 ? "1 cookbook" : `${cookbooks.length} cookbooks`}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />

          <div className="absolute bottom-full left-0 right-0 mb-1 bg-bg-card border border-border rounded-[14px] shadow-card z-30 overflow-hidden">
            {/* Cookbook list */}
            <div className="p-1.5 space-y-0.5 max-h-[220px] overflow-y-auto">
              {cookbooks.map((cb) => (
                <button
                  key={cb.id}
                  onClick={() => { setActiveCookbook(cb); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-[#F5F5F2] transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-[6px] bg-accent-bg flex items-center justify-center shrink-0">
                    <BookOpen className="w-3 h-3 text-accent" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-[12px] text-ink font-medium truncate">{cb.name}</span>
                  {cb.id === activeCookbook.id && (
                    <Check className="w-3 h-3 text-accent shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-border p-1.5 space-y-0.5">
              {/* Settings for active cookbook */}
              <button
                onClick={() => { setOpen(false); setSettingsOpen(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-[#F5F5F2] transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2} />
                <span className="text-[12px] text-ink-muted">Settings &amp; members</span>
              </button>

              {/* Create new cookbook */}
              {creating ? (
                <div className="px-3 py-1.5 flex gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateCookbook();
                      if (e.key === "Escape") { setCreating(false); setNewName(""); }
                    }}
                    placeholder="Cookbook name…"
                    className="flex-1 bg-bg-warm border border-border rounded-[8px] px-2 py-1 text-[11px] text-ink focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleCreateCookbook}
                    disabled={!newName.trim()}
                    className="bg-accent text-white rounded-[8px] px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
                  >
                    Create
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-[#F5F5F2] transition-colors text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2} />
                  <span className="text-[12px] text-ink-muted">New cookbook</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Settings modal */}
      {settingsOpen && userId && (
        <CookbookSettingsModal
          cookbook={activeCookbook}
          isOwner={isOwner}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          ownerId={userId}
        />
      )}
    </div>
  );
}
