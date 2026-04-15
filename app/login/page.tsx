"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/recipes`,
          data: { full_name: fullName },
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link, then sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/recipes");
        router.refresh();
      }
    }

    setLoading(false);
  }

  function switchMode(toSignUp: boolean) {
    setIsSignUp(toSignUp);
    setError("");
    setMessage("");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left image panel */}
      <div className="hidden md:block w-[45%] relative overflow-hidden bg-[#0F0F0F]">
        <Image
          src="/images/login-side.jpg"
          alt="A cozy kitchen scene with warm wooden shelves"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0F0F0F] opacity-30" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <h2 className="font-display font-bold text-[32px] text-white leading-tight mb-3">
            The kitchen is <em className="italic">yours</em>
          </h2>
          <p className="font-sans font-light text-[15px] text-[#888888] max-w-[320px] leading-relaxed">
            Plan, cook, and shop as a household. No more chaos, no more duplicate grocery runs.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 bg-[#F7F5F2]">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Rouxtine" style={{ height: 28, width: "auto" }} />
          </div>

          {/* Script tagline */}
          <div className="mb-8">
            <span className="font-script text-[20px] text-[#E8200F]">
              {isSignUp ? "Let's cook together" : "Welcome back"}
            </span>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-0 mb-8 border-b border-[#E5E3DF]">
            <button
              onClick={() => switchMode(false)}
              className={`pb-3 px-1 mr-6 font-sans font-medium text-[13px] tracking-[0.06em] transition-colors ${
                !isSignUp
                  ? "text-[#0F0F0F] border-b-2 border-[#E8200F]"
                  : "text-[#888888] hover:text-[#444444]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode(true)}
              className={`pb-3 px-1 font-sans font-medium text-[13px] tracking-[0.06em] transition-colors ${
                isSignUp
                  ? "text-[#0F0F0F] border-b-2 border-[#E8200F]"
                  : "text-[#888888] hover:text-[#444444]"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Sarah Chen"
                  className="w-full bg-white border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                required
                className="w-full bg-white border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
              />
            </div>

            <div>
              <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                required
                minLength={6}
                className="w-full bg-white border-2 border-[#E5E3DF] rounded-md px-4 py-3 font-sans font-light text-[14px] text-[#0F0F0F] placeholder:text-[#888888] focus:outline-none focus:border-[#0F0F0F] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-accent-bg border border-accent/20 rounded-md px-4 py-2.5 text-[12px] text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[14px] tracking-[0.04em] py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                "Start Your Kitchen"
              ) : (
                "Enter Your Kitchen"
              )}
            </button>
          </form>

          {/* Forgot password */}
          {!isSignUp && (
            <p className="text-center font-sans text-[12px] text-[#888888] mt-4">
              <Link href="/password-reset-request" className="hover:text-[#0F0F0F] transition-colors">
                Forgot your password?
              </Link>
            </p>
          )}

          {/* Back to home */}
          <p className="text-center font-sans text-[12px] text-[#888888] mt-6">
            <Link href="/" className="hover:text-[#0F0F0F] transition-colors">
              ← Back to Rouxtine
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
