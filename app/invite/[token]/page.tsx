"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { useCookbooks } from "@/hooks/useCookbooks";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "success" | "error" | "not_authenticated";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { acceptInvite } = useCookbooks();
  const supabase = createClient();

  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    handleAccept();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in — send to login with a redirect back here
      router.replace(`/login?redirectTo=/invite/${token}`);
      return;
    }

    const result = await acceptInvite(token);

    if (result.success) {
      setState("success");
      setTimeout(() => router.replace("/recipes"), 2000);
    } else {
      setState("error");
      const msgs: Record<string, string> = {
        invite_not_found: "This invite link is invalid or has expired.",
        invite_claimed: "This invite link has already been used by someone else.",
        update_failed: "Something went wrong accepting the invite. Please try again.",
      };
      setErrorMsg(msgs[result.error ?? ""] ?? "An unexpected error occurred.");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-bg-card border border-border rounded-card p-10 max-w-sm w-full text-center shadow-card">
        <div className="w-14 h-14 rounded-full bg-accent-bg flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-7 h-7 text-accent" strokeWidth={1.5} />
        </div>

        {state === "loading" && (
          <>
            <h1 className="font-bold text-[18px] text-ink mb-2">Joining cookbook…</h1>
            <p className="text-[13px] text-ink-muted mb-6">
              Accepting your invite, just a moment.
            </p>
            <Loader2 className="w-6 h-6 text-accent animate-spin mx-auto" />
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-herb mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-bold text-[18px] text-ink mb-2">You&apos;re in!</h1>
            <p className="text-[13px] text-ink-muted">
              You&apos;ve joined the cookbook. Redirecting you now…
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-10 h-10 text-danger mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="font-bold text-[18px] text-ink mb-2">Invite failed</h1>
            <p className="text-[13px] text-ink-muted mb-6">{errorMsg}</p>
            <button
              onClick={() => router.replace("/recipes")}
              className="bg-accent text-white rounded-pill px-6 py-2.5 text-[13px] font-semibold hover:-translate-y-[1px] transition-all"
            >
              Go to recipes
            </button>
          </>
        )}
      </div>
    </div>
  );
}
