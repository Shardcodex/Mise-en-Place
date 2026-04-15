"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, CalendarDays, ShoppingCart } from "lucide-react";

const RouxtineLogo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-3">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <circle cx="12" cy="18" r="8" stroke={dark ? "#FFFFFF" : "#0F0F0F"} strokeWidth="2" fill="none" />
      <line x1="18" y1="12" x2="25" y2="4" stroke={dark ? "#FFFFFF" : "#0F0F0F"} strokeWidth="2" strokeLinecap="round" />
    </svg>
    <span className={`font-display text-[22px] ${dark ? "text-white" : "text-[#0F0F0F]"}`}>
      <span className="font-bold">Roux</span>
      <em className="font-bold italic">tine</em>
    </span>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F2] font-sans text-[#0F0F0F]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F7F5F2] bg-opacity-95 backdrop-blur-sm border-b border-[#E5E3DF]">
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-center justify-between">
          <RouxtineLogo />
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-sans font-medium text-[12px] tracking-[0.08em] text-[#444444] uppercase hover:text-[#0F0F0F] transition-colors">Features</a>
            <a href="#how-it-works" className="font-sans font-medium text-[12px] tracking-[0.08em] text-[#444444] uppercase hover:text-[#0F0F0F] transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="font-sans font-medium text-[13px] text-[#0F0F0F] hover:text-[#E8200F] transition-colors">
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-[#E8200F] text-white font-sans font-medium text-[12px] tracking-[0.06em] px-5 py-2.5 rounded-lg hover:bg-[#C41A0C] transition-colors"
            >
              Start Your Kitchen
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <h1 className="font-display font-bold text-[56px] leading-[1.1] text-[#0F0F0F] max-w-[700px] mb-6">
              Every great meal <em className="italic">starts somewhere</em>
            </h1>
            <p className="font-sans font-light text-[18px] text-[#444444] max-w-[520px] leading-relaxed mb-10">
              The shared kitchen for modern households. Plan meals, organize recipes, and shop smarter — together.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="bg-[#E8200F] text-white font-sans font-medium text-[14px] tracking-[0.04em] px-8 py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors"
              >
                Start Your Kitchen
              </Link>
              <a
                href="#how-it-works"
                className="bg-white text-[#0F0F0F] font-sans font-medium text-[14px] tracking-[0.04em] px-8 py-3.5 rounded-lg border-2 border-[#E5E3DF] hover:border-[#0F0F0F] transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <Image
              src="/images/landing-hero.jpg"
              alt="A warm, sunlit modern kitchen"
              width={1200}
              height={420}
              className="w-full h-[420px] object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent opacity-40" />
            <div className="absolute bottom-0 left-0 right-0 p-10">
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {["SC", "MK", "JL", "DP"].map((initials, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-[#F7F5F2] border-2 border-[#0F0F0F] flex items-center justify-center">
                      <span className="font-sans font-medium text-[11px] text-[#0F0F0F]">{initials}</span>
                    </div>
                  ))}
                </div>
                <p className="font-sans font-light text-[14px] text-white">Join 12,000+ households cooking together</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" className="py-20 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-[36px] text-[#0F0F0F] mb-3">
              One kitchen, <em className="italic">everyone</em> in sync
            </h2>
            <p className="font-sans font-light text-[16px] text-[#444444] max-w-[480px] mx-auto">
              No more recipe chaos. No more &ldquo;what&apos;s for dinner?&rdquo; No more duplicate grocery runs.
            </p>
          </div>
          <div className="space-y-5">
            {[
              {
                icon: BookOpen,
                title: "A Shared Cookbook",
                description: "Every recipe in one place. Clip from the web, add your own, tag and organize your way. The whole household sees the same library.",
              },
              {
                icon: CalendarDays,
                title: "Weekly Meal Planning",
                description: "Tap to assign meals. Get smart suggestions based on what you cook. Remix your week in seconds. Dinner, handled.",
              },
              {
                icon: ShoppingCart,
                title: "Shopping, Simplified",
                description: "Your meal plan builds the list automatically. Mark pantry staples and they stay hidden. Check off items together in real-time.",
              },
            ].map(({ icon: Icon, title, description }, i) => (
              <div key={i} className="flex items-start gap-6 bg-[#F7F5F2] rounded-xl border-2 border-[#E5E3DF] p-8 hover:border-[#444444] transition-all">
                <div className="w-14 h-14 rounded-xl bg-white border-2 border-[#E5E3DF] flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-[#E8200F]" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-[22px] text-[#0F0F0F] mb-2">{title}</h3>
                  <p className="font-sans font-light text-[15px] text-[#444444] leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="how-it-works" className="py-20 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "We stopped arguing about dinner. That alone is worth it.", name: "Sarah & Mike", detail: "Portland, OR · 2 years" },
              { quote: "The shopping list changed everything. No more \u2018did you get the...?\u2019 texts.", name: "The Kapoor Family", detail: "Austin, TX · 8 months" },
              { quote: "It feels like our kitchen finally has a system that works for everyone.", name: "Jenna & Roommates", detail: "Brooklyn, NY · 1 year" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col">
                <p className="font-display italic text-[20px] text-[#0F0F0F] leading-relaxed mb-6">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="font-sans font-medium text-[13px] text-[#0F0F0F]">{item.name}</p>
                  <p className="font-sans font-light text-[12px] text-[#888888]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8 bg-[#0F0F0F]">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="font-display font-bold text-[40px] text-white mb-4">
            Ready to cook <em className="italic">together</em>?
          </h2>
          <p className="font-sans font-light text-[16px] text-[#888888] max-w-[400px] mx-auto mb-8">
            Set up your shared kitchen in under two minutes. Free for your household.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#E8200F] text-white font-sans font-medium text-[14px] tracking-[0.04em] px-10 py-3.5 rounded-lg hover:bg-[#C41A0C] transition-colors"
          >
            Start Your Kitchen
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F0F0F] border-t border-[#444444] px-8 py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-start justify-between mb-10">
            <RouxtineLogo dark />
            <div className="flex items-center gap-10">
              <a href="#" className="font-sans font-light text-[13px] text-[#888888] hover:text-white transition-colors">Privacy</a>
              <a href="#" className="font-sans font-light text-[13px] text-[#888888] hover:text-white transition-colors">Terms</a>
              <a href="#" className="font-sans font-light text-[13px] text-[#888888] hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-[#444444] pt-6 flex items-center justify-between">
            <p className="font-sans font-light text-[12px] text-[#888888]">© 2025 Rouxtine. All rights reserved.</p>
            <span className="font-script text-[16px] text-[#888888]">Cook well</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
