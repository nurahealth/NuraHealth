import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import NuraPageShell from "@/components/NuraPageShell";
import ShopClient from "./ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  return (
    <NuraPageShell maxWidth={780} desktopMaxWidth={900}>
      <ShopClient />
    </NuraPageShell>
  );
}
