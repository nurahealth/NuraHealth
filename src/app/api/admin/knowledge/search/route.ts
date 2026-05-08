import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchKnowledgeBase, searchKnowledgeBaseByText } from "@/lib/knowledge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      query?: string;
      limit?: number;
      threshold?: number;
      userId?: string;
      token?: string;
    };

    const { query, limit = 5, threshold = 0.7, userId, token } = body;

    console.log("[admin/search/api] userId:", userId, "hasToken:", !!token, "query:", query);

    if (!userId || !token) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: profile, error: profileError } = await authClient
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    console.log("[admin/search/api] profile query result:", profile, "error:", profileError);

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
    }

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const embedding = await generateEmbedding(query);
    const results = embedding
      ? await searchKnowledgeBase(embedding, limit, threshold)
      : await searchKnowledgeBaseByText(query, limit);

    return NextResponse.json({ results, usedEmbedding: !!embedding });
  } catch (err) {
    console.error("[admin/search/api] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
