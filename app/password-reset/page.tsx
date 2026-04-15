"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const RouxtineMark = () => (
  <div className="flex items-center gap-3 justify-center mb-10">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <circle cx="12" cy="18" r="8" stroke="#0F0F0F" strokeWidth="2" fill="none" />
      <line x1="18" y1="12" x2="25" y2="4" stroke="#0F0F0F" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span className="font-display text-[22px] text-[#0F0F0F]">
      <span className="font-bold">Roux</span>
      <em className="font-bold italic">tine</em>
    </span>
  </div>
);

export default function PasswordResetPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/recipes");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-[#F7F5F2] text-[#0F0F0F] px-4">
      <div className="w-full max-w-[400px]">
        <RouxtineMark />

        <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E3DF] flex items-center justify-center mx-auto mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <Lock className="w-6 h-6 text-[#E8200F]" strokeWidth={1.5} />
        </div>

        <h1 className="font-display font-bold text-[28px] text-[#0F0F0F] text-center mb-2">
          Set new password
        </h1>
        <p className="font-sans font-light text-[14px] text-[#888888] text-center mb-8">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
            <div className="space-y-4 mb-5">
              <div>
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                />
              </div>
              <div>
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[13px] tracking-[0.06em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </button>
          </div>
        </form>

        <p className="text-center">
          <Link href="/login" className="font-sans font-light text-[13px] text-[#888888] hover:text-[#0F0F0F] transition-colors">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
