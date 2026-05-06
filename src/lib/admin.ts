import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Server-side check using user ID (uses service role or anon key against profiles)
export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return (data as { is_admin: boolean } | null)?.is_admin === true;
}

// Use in server components (layout.tsx) — reads session from cookies
export async function getAdminSessionFromCookies(): Promise<{ userId: string } | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: cookieStore
              .getAll()
              .map((c) => `${c.name}=${c.value}`)
              .join("; "),
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const ok = await isUserAdmin(user.id);
    if (!ok) return null;
    return { userId: user.id };
  } catch {
    return null;
  }
}

// Use in API route handlers — reads Bearer token from Authorization header
export async function requireAdminFromRequest(
  req: NextRequest
): Promise<{ userId: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AdminError("Unauthorized", 401);
  }
  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new AdminError("Unauthorized", 401);
  const ok = await isUserAdmin(user.id);
  if (!ok) throw new AdminError("Forbidden — admin only", 403);
  return { userId: user.id };
}

export class AdminError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
