import { redirect } from "next/navigation";
import { getAdminSessionFromCookies } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/");
  }
  return <>{children}</>;
}
