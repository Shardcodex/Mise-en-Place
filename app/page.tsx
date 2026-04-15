import { redirect } from "next/navigation";
import { createClient as createServerClient } from "@/lib/supabase/server";
import LandingPage from "./LandingPage";

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/recipes");
  return <LandingPage />;
}
