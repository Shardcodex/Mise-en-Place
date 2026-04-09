import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get recipe count for sidebar
  const { count } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return <AppShell recipeCount={count ?? 0}>{children}</AppShell>;
}
