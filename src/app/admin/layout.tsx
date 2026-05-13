import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log("[admin/layout] no authenticated user — redirecting to /");
    redirect("/");
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  console.log("[admin/layout] user:", user.email, "is_admin:", profile?.is_admin ?? false);

  if (!profile?.is_admin) {
    console.log("[admin/layout] not admin — redirecting to /");
    redirect("/");
  }

  return <>{children}</>;
}
