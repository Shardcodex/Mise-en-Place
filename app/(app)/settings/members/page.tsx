"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Crown, User, Copy, Check, Loader2, UserPlus } from "lucide-react";
import { useCookbookContext } from "@/contexts/CookbookContext";
import type { CookbookMember } from "@/lib/types";

export default function MembersPage() {
  const { activeCookbook, fetchMembers, inviteMember, removeMember } = useCookbookContext();
  const [members, setMembers] = useState<CookbookMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCookbook) return;
    loadMembers();
  }, [activeCookbook?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMembers() {
    if (!activeCookbook) return;
    setLoading(true);
    const data = await fetchMembers(activeCookbook.id);
    setMembers(data);
    setLoading(false);
  }

  async function handleGenerateLink() {
    if (!activeCookbook) return;
    setGeneratingLink(true);
    const url = await inviteMember(activeCookbook.id);
    setInviteUrl(url);
    setGeneratingLink(false);
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRemove(member: CookbookMember) {
    if (!confirm(`Remove ${member.profile?.display_name ?? member.invited_email ?? "this member"}?`)) return;
    setRemovingId(member.id);
    await removeMember(member.id);
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setRemovingId(null);
  }

  const accepted = members.filter((m) => m.status === "accepted");
  const pending = members.filter((m) => m.status === "pending");

  function getInitials(member: CookbookMember) {
    const name = member.profile?.display_name ?? member.invited_email ?? "?";
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Sub-header */}
      <div className="px-8 py-6 border-b border-[#E5E3DF] bg-[#F7F5F2]">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="w-8 h-8 rounded-lg bg-white border-2 border-[#E5E3DF] flex items-center justify-center hover:border-[#444444] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#444444]" strokeWidth={2} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#0F0F0F]">Members</h1>
            <p className="font-sans font-light text-[13px] text-[#888888] mt-0.5">
              {activeCookbook?.name} · {accepted.length} cook{accepted.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-[640px]">
        {/* Current members */}
        <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-8 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h2 className="font-display font-bold text-[20px] text-[#0F0F0F] mb-6">Current Members</h2>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[#888888]" />
            </div>
          ) : (
            <div className="space-y-0">
              {accepted.map((member, i) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 py-4 ${i > 0 ? "border-t border-[#E5E3DF]" : ""}`}
                >
                  <div className="w-11 h-11 rounded-full bg-[#F7F5F2] border-2 border-[#E5E3DF] flex items-center justify-center shrink-0">
                    <span className="font-sans font-medium text-[13px] text-[#0F0F0F]">{getInitials(member)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-medium text-[14px] text-[#0F0F0F]">
                      {member.profile?.display_name ?? member.invited_email ?? "Unknown"}
                    </p>
                    <p className="font-sans font-light text-[12px] text-[#888888]">
                      {member.invited_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center gap-1.5 font-sans font-medium text-[11px] tracking-[0.06em] px-2.5 py-1 rounded-full ${
                        member.role === "owner"
                          ? "bg-[#E8200F]/10 text-[#E8200F]"
                          : "bg-[#F7F5F2] text-[#888888]"
                      }`}
                    >
                      {member.role === "owner" ? (
                        <Crown className="w-3 h-3" strokeWidth={2} />
                      ) : (
                        <User className="w-3 h-3" strokeWidth={2} />
                      )}
                      {member.role === "owner" ? "Admin" : "Member"}
                    </span>
                    {member.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(member)}
                        disabled={removingId === member.id}
                        className="font-sans font-light text-[12px] text-[#888888] hover:text-danger transition-colors"
                      >
                        {removingId === member.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Remove"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending invitations */}
        {pending.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-8 mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="font-display font-bold text-[20px] text-[#0F0F0F] mb-6">Pending Invitations</h2>
            <div className="space-y-3">
              {pending.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-sans font-medium text-[13px] text-[#0F0F0F]">
                      {member.invited_email}
                    </p>
                    <p className="font-sans font-light text-[11px] text-[#888888]">Invitation pending</p>
                  </div>
                  <span className="font-sans text-[11px] text-[#888888] bg-[#F7F5F2] rounded-full px-2.5 py-1">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite a cook */}
        <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-5 h-5 text-[#E8200F]" strokeWidth={1.5} />
            <h2 className="font-display font-bold text-[20px] text-[#0F0F0F]">Invite a Cook</h2>
          </div>
          <p className="font-sans font-light text-[14px] text-[#444444] mb-6 leading-relaxed">
            Generate a unique invitation link to share with your household members.
          </p>

          {inviteUrl ? (
            <div>
              <div className="flex items-center gap-2 bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-lg px-4 py-3 mb-3">
                <p className="flex-1 font-sans font-light text-[12px] text-[#444444] truncate">{inviteUrl}</p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 font-sans font-medium text-[11px] text-[#E8200F] hover:text-[#C41A0C] transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="font-sans font-light text-[11px] text-[#888888]">
                This link expires in 7 days. Each link can be used once.
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[13px] tracking-[0.06em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
            >
              {generatingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" strokeWidth={2} />
                  Generate Invite Link
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
