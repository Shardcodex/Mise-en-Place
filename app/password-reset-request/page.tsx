"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-[#F7F5F2] text-[#0F0F0F] px-4">
      {!submitted ? (
        <div className="w-full max-w-[400px]">
          <RouxtineMark />

          <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#E5E3DF] flex items-center justify-center mx-auto mb-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <KeyRound className="w-6 h-6 text-[#E8200F]" strokeWidth={1.5} />
          </div>

          <h1 className="font-display font-bold text-[28px] text-[#0F0F0F] text-center mb-2">
            Reset your password
          </h1>
          <p className="font-sans font-light text-[14px] text-[#888888] text-center mb-8">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
              <div className="mb-5">
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  required
                  className="w-full bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[13px] tracking-[0.06em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </button>
            </div>
          </form>

          <p className="text-center">
            <Link href="/login" className="font-sans font-light text-[13px] text-[#888888] hover:text-[#0F0F0F] transition-colors">
              Back to Sign In
            </Link>
          </p>
        </div>
      ) : (
        <div className="w-full max-w-[400px]">
          <RouxtineMark />
          <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-center">
            <div className="w-14 h-14 rounded-full bg-[#F7F5F2] border-2 border-[#E5E3DF] flex items-center justify-center mx-auto mb-5">
              <Mail className="w-6 h-6 text-[#E8200F]" strokeWidth={1.5} />
            </div>
            <h2 className="font-display font-bold text-[22px] text-[#0F0F0F] mb-3">Check your email</h2>
            <p className="font-sans font-light text-[14px] text-[#888888] leading-relaxed mb-6">
              If an account exists with that email, you will receive a password reset link shortly.
            </p>
            <p className="font-sans font-light text-[12px] text-[#888888]">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button onClick={() => setSubmitted(false)} className="text-[#E8200F] hover:underline">
                try again
              </button>
              .
            </p>
          </div>
          <p className="text-center mt-6">
            <Link href="/login" className="font-sans font-light text-[13px] text-[#888888] hover:text-[#0F0F0F] transition-colors">
              Back to Sign In
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
