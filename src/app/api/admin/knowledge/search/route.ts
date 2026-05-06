import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { generateEmbedding } from "@/lib/embeddings";
import { searchKnowledgeBase, searchKnowledgeBaseByText } from "@/lib/knowledge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, limit = 5, threshold = 0.7 } = await req.json() as {
    query: string;
    limit?: number;
    threshold?: number;
  };

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const embedding = await generateEmbedding(query);

  let results;
  if (embedding) {
    results = await searchKnowledgeBase(embedding, limit, threshold);
  } else {
    // Fallback text search
    results = await searchKnowledgeBaseByText(query, limit);
  }

  return NextResponse.json({ results, usedEmbedding: !!embedding });
}
