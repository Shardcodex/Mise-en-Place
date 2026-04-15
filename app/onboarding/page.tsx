"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCookbookContext } from "@/contexts/CookbookContext";

const TIMEZONES = [
  "America/New_York (EST)",
  "America/Chicago (CST)",
  "America/Denver (MST)",
  "America/Los_Angeles (PST)",
  "Europe/London (GMT)",
  "Europe/Paris (CET)",
  "Asia/Tokyo (JST)",
  "Australia/Sydney (AEST)",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { createCookbook } = useCookbookContext();
  const [cookbookName, setCookbookName] = useState("");
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cookbookName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const cookbook = await createCookbook(cookbookName.trim());
      if (cookbook) {
        router.push("/recipes");
      } else {
        setError("Failed to create cookbook. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen flex font-sans bg-[#F7F5F2] text-[#0F0F0F] overflow-hidden">
      {/* Left image panel */}
      <div className="hidden md:block w-[35%] relative overflow-hidden bg-[#0F0F0F]">
        <Image
          src="/images/onboarding-side.jpg"
          alt="A rustic kitchen scene"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/30 to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <div className="flex items-center gap-3 mb-6">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <circle cx="12" cy="18" r="8" stroke="#FFFFFF" strokeWidth="2" fill="none" />
              <line x1="18" y1="12" x2="25" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-[22px] text-white">
              <span className="font-bold">Roux</span>
              <em className="font-bold italic">tine</em>
            </span>
          </div>
          <p className="font-display italic text-[18px] text-white leading-relaxed mb-3">
            &ldquo;A kitchen is only as good as the people who share it.&rdquo;
          </p>
          <p className="font-sans font-light text-[13px] text-[#888888]">— Old wisdom, new tools</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-16">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {[
            { n: 1, label: "Name Your Kitchen", active: true },
            { n: 2, label: "Invite Cooks", active: false },
            { n: 3, label: "First Recipe", active: false },
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.active
                      ? "bg-[#E8200F]"
                      : "bg-[#F7F5F2] border-2 border-[#E5E3DF]"
                  }`}
                >
                  <span
                    className={`font-sans font-medium text-[12px] ${
                      step.active ? "text-white" : "text-[#888888]"
                    }`}
                  >
                    {step.n}
                  </span>
                </div>
                <span
                  className={`font-sans font-medium text-[12px] ${
                    step.active ? "text-[#0F0F0F]" : "text-[#888888]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < arr.length - 1 && <div className="w-12 h-px bg-[#E5E3DF]" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-[42px] text-[#0F0F0F] leading-[1.15] mb-4">
              Name <em className="italic">your</em> kitchen
            </h1>
            <p className="font-sans font-light text-[16px] text-[#444444] leading-relaxed">
              This is your household&apos;s shared space. Give it a name that feels like home.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl border-2 border-[#E5E3DF] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
              <div className="mb-6">
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-3">
                  Cookbook Name
                </label>
                <input
                  type="text"
                  value={cookbookName}
                  onChange={(e) => setCookbookName(e.target.value)}
                  placeholder="e.g. The Chen Kitchen"
                  required
                  className="w-full bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-md px-5 py-4 font-display font-bold text-[18px] text-[#0F0F0F] placeholder:text-[#888888] placeholder:font-sans placeholder:font-light placeholder:text-[14px] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                />
              </div>

              <div>
                <label className="block font-sans font-medium text-[11px] tracking-[0.12em] text-[#888888] uppercase mb-3">
                  Timezone
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-[#F7F5F2] border-2 border-[#E5E3DF] rounded-md px-5 py-3.5 font-sans font-light text-[14px] text-[#0F0F0F] appearance-none focus:outline-none focus:border-[#0F0F0F] transition-colors cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#888888] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-danger-bg border border-danger/20 rounded-md px-4 py-2.5 text-[12px] text-danger">
                {error}
              </div>
            )}

            <div className="text-center mb-8">
              <span className="font-script text-[22px] text-[#E8200F]">The heart of the home</span>
            </div>

            <button
              type="submit"
              disabled={loading || !cookbookName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#E8200F] text-white font-sans font-medium text-[14px] tracking-[0.06em] py-4 rounded-lg hover:bg-[#C41A0C] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Open the Kitchen"
              )}
            </button>

            <p className="mt-5 text-center font-sans font-light text-[12px] text-[#888888]">
              You can invite household members after setup
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
