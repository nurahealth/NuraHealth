import { createClient } from "@supabase/supabase-js";

// Use service role when available (server-side only), fall back to anon
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export interface KnowledgeSource {
  id: string;
  title: string;
  author: string | null;
  source_type: "book" | "research" | "article" | "other";
  topics: string[] | null;
  conditions: string[] | null;
  key_concepts: string[] | null;
  summary: string | null;
  status: "processing" | "analyzed" | "failed";
  error_message: string | null;
  file_url: string | null;
  file_size: number | null;
  chunk_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  source_id: string;
  content: string;
  chunk_index: number;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ChunkSearchResult {
  id: string;
  source_id: string;
  content: string;
  similarity: number;
  source_title: string;
  source_author: string | null;
  source_topics: string[] | null;
}

export interface SourceCounts {
  total: number;
  books: number;
  research: number;
  articles: number;
  processing: number;
  failed: number;
}

// ─── Sources ─────────────────────────────────────────────────────────────────

export async function createKnowledgeSource(
  data: Partial<Omit<KnowledgeSource, "id" | "created_at" | "updated_at">>
): Promise<KnowledgeSource> {
  const sb = getAdminClient();
  const { data: row, error } = await sb
    .from("knowledge_sources")
    .insert({ ...data, status: data.status ?? "processing" })
    .select()
    .single();
  if (error) throw error;
  return row as KnowledgeSource;
}

export async function updateKnowledgeSource(
  sourceId: string,
  data: Partial<Omit<KnowledgeSource, "id" | "created_at">>
): Promise<void> {
  const sb = getAdminClient();
  const { error } = await sb
    .from("knowledge_sources")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", sourceId);
  if (error) throw error;
}

export async function deleteKnowledgeSource(sourceId: string): Promise<void> {
  const sb = getAdminClient();
  // Chunks cascade via FK, but delete explicitly to be safe
  await sb.from("knowledge_chunks").delete().eq("source_id", sourceId);
  const { error } = await sb.from("knowledge_sources").delete().eq("id", sourceId);
  if (error) throw error;
}

export async function getKnowledgeSources(filters?: {
  status?: KnowledgeSource["status"];
  source_type?: KnowledgeSource["source_type"];
}): Promise<KnowledgeSource[]> {
  const sb = getAdminClient();
  let q = sb.from("knowledge_sources").select("*").order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.source_type) q = q.eq("source_type", filters.source_type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KnowledgeSource[];
}

export async function getSourceCounts(): Promise<SourceCounts> {
  const sb = getAdminClient();
  const { data, error } = await sb.from("knowledge_sources").select("source_type, status");
  if (error) throw error;
  const rows = (data ?? []) as { source_type: string; status: string }[];
  return {
    total: rows.length,
    books: rows.filter((r) => r.source_type === "book").length,
    research: rows.filter((r) => r.source_type === "research").length,
    articles: rows.filter((r) => r.source_type === "article").length,
    processing: rows.filter((r) => r.status === "processing").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };
}

// ─── Chunks ──────────────────────────────────────────────────────────────────

export async function insertChunks(
  sourceId: string,
  chunks: { content: string; chunk_index: number; embedding: number[] | null; metadata?: Record<string, unknown> | null }[]
): Promise<void> {
  if (chunks.length === 0) return;
  const sb = getAdminClient();
  const rows = chunks.map((c) => ({
    source_id: sourceId,
    content: c.content,
    chunk_index: c.chunk_index,
    embedding: c.embedding,
    metadata: c.metadata ?? null,
  }));
  // Insert in batches of 50 to avoid payload limits
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await sb.from("knowledge_chunks").insert(rows.slice(i, i + 50));
    if (error) throw error;
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchKnowledgeBase(
  queryEmbedding: number[],
  limit = 5,
  threshold = 0.7
): Promise<ChunkSearchResult[]> {
  const sb = getAdminClient();
  const { data, error } = await sb.rpc("match_knowledge_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });
  if (error) {
    console.error("[knowledge] searchKnowledgeBase RPC error:", error.message);
    return [];
  }
  return (data ?? []) as ChunkSearchResult[];
}

export async function searchKnowledgeBaseByText(
  query: string,
  limit = 5
): Promise<ChunkSearchResult[]> {
  const sb = getAdminClient();
  const { data, error } = await sb
    .from("knowledge_chunks")
    .select("id, source_id, content, knowledge_sources!inner(title, author, topics)")
    .ilike("content", `%${query}%`)
    .limit(limit);
  if (error) {
    console.error("[knowledge] text search error:", error.message);
    return [];
  }
  return ((data ?? []) as unknown as Array<{
    id: string;
    source_id: string;
    content: string;
    knowledge_sources: { title: string; author: string | null; topics: string[] | null };
  }>).map((r) => ({
    id: r.id,
    source_id: r.source_id,
    content: r.content,
    similarity: 0,
    source_title: r.knowledge_sources.title,
    source_author: r.knowledge_sources.author,
    source_topics: r.knowledge_sources.topics,
  }));
}
