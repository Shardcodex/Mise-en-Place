"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Trash2, UserPlus, Crown, User, Loader2, BookOpen } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useCookbookContext } from "@/contexts/CookbookContext";
import type { Cookbook, CookbookMember } from "@/lib/types";

interface CookbookSettingsModalProps {
  cookbook: Cookbook;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
  ownerId: string;
}

export default function CookbookSettingsModal({
  cookbook,
  isOwner,
  open,
  onClose,
  ownerId,
}: CookbookSettingsModalProps) {
  const { renameCookbook, fetchMembers, inviteMember, removeMember, deleteCookbook, setActiveCookbook, cookbooks } =
    useCookbookContext();

  const [name, setName] = useState(cookbook.name);
  const [members, setMembers] = useState<CookbookMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(cookbook.name);
    setInviteUrl(null);
    loadMembers();
  }, [open, cookbook.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMembers() {
    setLoadingMembers(true);
    const data = await fetchMembers(cookbook.id);
    setMembers(data);
    setLoadingMembers(false);
  }

  async function handleSaveName() {
    if (!name.trim() || name === cookbook.name) return;
    setSaving(true);
    await renameCookbook(cookbook.id, name.trim());
    setSaving(false);
  }

  async function handleGenerateLink() {
    setGeneratingLink(true);
    const url = await inviteMember(cookbook.id);
    setInviteUrl(url);
    setGeneratingLink(false);
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemoveMember(member: CookbookMember) {
    await removeMember(member.id);
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  }

  async function handleDeleteCookbook() {
    if (!confirm(`Delete "${cookbook.name}"? This will permanently remove all its recipes.`)) return;
    const remaining = cookbooks.filter((c) => c.id !== cookbook.id);
    if (remaining.length > 0) setActiveCookbook(remaining[0]);
    await deleteCookbook(cookbook.id);
    onClose();
  }

  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const pendingMembers = members.filter((m) => m.status === "pending");

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-[520px]">
      {/* Header */}
      <div className="sticky top-0 bg-bg-card z-10 px-7 pt-6 pb-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent" strokeWidth={2} />
          <h2 className="font-bold text-[16px] text-ink">Cookbook Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-bg-warm flex items-center justify-center hover:bg-border transition-colors"
        >
          <X className="w-4 h-4 text-ink-light" strokeWidth={2} />
        </button>
      </div>

      <div className="px-7 py-6 space-y-6">
        {/* Name */}
        {isOwner && (
          <div>
            <label className="block font-medium text-[12px] text-ink-light mb-1.5">Cookbook name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="flex-1 bg-bg-warm border border-border rounded-input px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-accent transition-colors"
              />
              {saving && <Loader2 className="w-4 h-4 text-ink-muted animate-spin self-center" />}
            </div>
          </div>
        )}

        {/* Invite link */}
        {isOwner && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-[12px] text-ink-light">Invite link</label>
              <span className="text-[10px] text-ink-muted">Anyone with the link can join</span>
            </div>
            {inviteUrl ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 bg-bg-warm border border-border rounded-input px-3 py-2 text-[11px] text-ink-muted truncate"
                />
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-accent text-white rounded-input px-3 py-2 text-[11px] font-semibold hover:-translate-y-[1px] transition-all shrink-0"
                >
                  {copied ? <Check className="w-3 h-3" strokeWidth={2.5} /> : <Copy className="w-3 h-3" strokeWidth={2} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="flex items-center gap-2 bg-bg-warm border border-border rounded-input px-4 py-2 text-[12px] text-ink-light hover:border-accent hover:text-accent transition-all disabled:opacity-50"
              >
                {generatingLink
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />}
                Generate invite link
              </button>
            )}
          </div>
        )}

        {/* Members */}
        <div>
          <label className="block font-medium text-[12px] text-ink-light mb-3">
            Members{acceptedMembers.length > 0 && ` · ${acceptedMembers.length + 1}`}
          </label>

          {loadingMembers ? (
            <div className="flex items-center gap-2 text-ink-muted py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[12px]">Loading…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Owner row */}
              <div className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] bg-[#F8F8F5]">
                <div className="w-7 h-7 rounded-full bg-accent-bg flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-accent" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-ink truncate">
                    {isOwner ? "You" : "Owner"}
                  </p>
                  <p className="text-[10px] text-ink-muted">Owner</p>
                </div>
              </div>

              {/* Accepted members */}
              {acceptedMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] bg-[#F8F8F5]">
                  <div className="w-7 h-7 rounded-full bg-bg-warm border border-border flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-ink-muted" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-ink truncate">
                      {m.profile?.display_name || m.invited_email || "Member"}
                    </p>
                    <p className="text-[10px] text-ink-muted">Member</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      className="text-ink-muted hover:text-danger transition-colors"
                      title="Remove member"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}

              {/* Pending invites */}
              {pendingMembers.length > 0 && isOwner && (
                <div className="pt-1">
                  <p className="text-[10px] text-ink-muted mb-1.5 px-1">Pending invites</p>
                  {pendingMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] bg-[#F8F8F5] opacity-60 mb-2">
                      <div className="w-7 h-7 rounded-full bg-bg-warm border border-dashed border-border flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-ink-muted" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-ink-muted truncate">
                          {m.invited_email ?? "Invite link generated"}
                        </p>
                        <p className="text-[10px] text-ink-muted">Awaiting acceptance</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m)}
                        className="text-ink-muted hover:text-danger transition-colors"
                        title="Revoke invite"
                      >
                        <Trash2 className="w-3 h-3" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danger zone */}
        {isOwner && (
          <div className="border-t border-border pt-5">
            <button
              onClick={handleDeleteCookbook}
              className="flex items-center gap-2 text-danger hover:bg-danger-bg rounded-input px-3 py-2 text-[12px] font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Delete cookbook
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
