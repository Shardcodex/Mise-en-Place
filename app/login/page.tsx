"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChefHat, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        options: { emailRedirectTo: `${window.location.origin}/recipes` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link, then sign in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/recipes");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-accent-bg flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-accent" strokeWidth={1.5} />
          </div>
          <h1 className="font-semibold text-[22px] tracking-[-0.02em] text-ink lowercase">
            mise en place
          </h1>
          <p className="text-[13px] text-ink-muted mt-1">
            your kitchen companion
          </p>
        </div>

        {/* Form card */}
        <div className="bg-bg-card rounded-card border border-border p-8">
          <h2 className="font-bold text-[18px] text-ink mb-1">
            {isSignUp ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-[13px] text-ink-muted mb-6">
            {isSignUp
              ? "Sign up to save your recipes in the cloud"
              : "Sign in to access your recipes"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-[12px] text-ink-light mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-bg-warm border border-border rounded-input pl-10 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[12px] text-ink-light mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={2} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "At least 6 characters" : "Your password"}
                  required
                  minLength={6}
                  className="w-full bg-bg-warm border border-border rounded-input pl-10 pr-4 py-2.5 text-[13px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="bg-danger-bg border border-danger/20 rounded-input px-4 py-2.5 text-[12px] text-danger">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-accent-bg border border-accent/20 rounded-input px-4 py-2.5 text-[12px] text-herb">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white rounded-pill py-3 text-[13px] font-semibold hover:-translate-y-[1px] hover:shadow-button transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create account" : "Sign in"}
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Toggle sign up / sign in */}
        <p className="text-center text-[13px] text-ink-muted mt-6">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="text-accent font-semibold hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
