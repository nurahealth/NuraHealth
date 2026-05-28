import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chunkText } from "@/lib/chunking";
import { generateEmbeddings } from "@/lib/embeddings";
import { createKnowledgeSource, updateKnowledgeSource, insertChunks } from "@/lib/knowledge";

export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const METADATA_PROMPT = `Analyze this transcript and return ONLY a JSON object with these fields:
{
  "topics": ["topic1", "topic2"],
  "conditions": ["condition1"],
  "key_concepts": ["concept1", "concept2"],
  "summary": "2-3 sentence summary of the main content"
}
Aim for 3-7 topics, 0-5 conditions covered, and 5-10 key concepts. Return ONLY valid JSON, no markdown.`;

async function extractMetadata(text: string) {
  const snippet = text.slice(0, 10000);
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 800,
    messages: [{ role: "user", content: `${METADATA_PROMPT}\n\nTranscript:\n${snippet}` }],
  });
  const raw = res.content.find((c) => c.type === "text");
  const txt = raw && "text" in raw ? raw.text : "";
  const cleaned = txt.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in metadata response");
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  return {
    topics: Array.isArray(parsed.topics) ? (parsed.topics as string[]) : [],
    conditions: Array.isArray(parsed.conditions) ? (parsed.conditions as string[]) : [],
    key_concepts: Array.isArray(parsed.key_concepts) ? (parsed.key_concepts as string[]) : [],
    summary: (parsed.summary as string) ?? "",
  };
}

const AUDIO_MIME = new Set([
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
  "audio/wav", "audio/x-wav", "audio/webm",
]);
const VIDEO_MIME = new Set(["video/mp4", "video/mpeg", "video/webm"]);
const MAX_BYTES = 25 * 1024 * 1024;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs[0] === "shorts" || segs[0] === "embed" || segs[0] === "live") {
        const id = segs[1];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchYoutubeMetadata(url: string): Promise<{ title: string; author: string }> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return { title: "YouTube Video", author: "" };
    const data = (await res.json()) as { title?: string; author_name?: string };
    return { title: data.title ?? "YouTube Video", author: data.author_name ?? "" };
  } catch {
    return { title: "YouTube Video", author: "" };
  }
}

function cleanTranscript(segments: { text: string }[]): string {
  return segments
    .map((s) => s.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\[[^\]]+\]/g, "") // strip [Music], [Applause], etc.
    .trim();
}

async function verifyAdmin(userId: string, token: string): Promise<boolean> {
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: profile } = await authClient
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return Boolean((profile as { is_admin?: boolean } | null)?.is_admin);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      return await handleYoutube(req);
    }
    return await handleFile(req);
  } catch (err) {
    console.error("[admin/video/api] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}

// ─── YouTube branch ──────────────────────────────────────────────────────────

async function handleYoutube(req: NextRequest): Promise<NextResponse> {
  let body: { mode?: string; youtubeUrl?: string; userId?: string; token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mode, youtubeUrl, userId, token } = body;

  if (mode !== "youtube") {
    return NextResponse.json({ error: "mode must be 'youtube' for JSON requests" }, { status: 400 });
  }
  if (!userId || !token) {
    return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
  }
  if (!(await verifyAdmin(userId, token))) {
    return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
  }
  if (!youtubeUrl?.trim()) {
    return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
  }

  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }

  // Fetch transcript
  let segments: { text: string }[];
  try {
    segments = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (err) {
    console.warn("[admin/video/api] transcript fetch failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "This video doesn't have captions. Try uploading the audio file directly instead." },
      { status: 400 }
    );
  }
  if (!segments || segments.length === 0) {
    return NextResponse.json(
      { error: "This video doesn't have captions. Try uploading the audio file directly instead." },
      { status: 400 }
    );
  }

  const text = cleanTranscript(segments);
  if (!text) {
    return NextResponse.json(
      { error: "This video doesn't have captions. Try uploading the audio file directly instead." },
      { status: 400 }
    );
  }

  // Fetch metadata (non-fatal)
  const meta = await fetchYoutubeMetadata(youtubeUrl);

  // Create source row
  const source = await createKnowledgeSource({
    uploaded_by: userId,
    title: meta.title,
    author: meta.author || null,
    source_type: "video",
    status: "processing",
    file_url: youtubeUrl,
    file_size: new TextEncoder().encode(text).length,
  });

  try {
    const meta = await extractMetadata(text);
    await updateKnowledgeSource(source.id, {
      topics: meta.topics,
      conditions: meta.conditions,
      key_concepts: meta.key_concepts,
      summary: meta.summary,
    });

    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    await insertChunks(
      source.id,
      chunks.map((content, i) => ({ content, chunk_index: i, embedding: embeddings[i] }))
    );
    await updateKnowledgeSource(source.id, { status: "analyzed", chunk_count: chunks.length });

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      chunkCount: chunks.length,
      sourceType: "video",
    });
  } catch (err) {
    await updateKnowledgeSource(source.id, {
      status: "failed",
      error_message: err instanceof Error ? err.message : "Processing failed",
    });
    throw err;
  }
}

// ─── File branch (Whisper) ───────────────────────────────────────────────────

async function handleFile(req: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const mode = formData.get("mode") as string | null;
  const userId = formData.get("userId") as string | null;
  const token = formData.get("token") as string | null;
  const fileField = formData.get("file");

  if (mode !== "file") {
    return NextResponse.json({ error: "mode must be 'file' for multipart requests" }, { status: 400 });
  }
  if (!userId || !token) {
    return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
  }
  if (!(await verifyAdmin(userId, token))) {
    return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
  }
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const file = fileField;

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Whisper supports files up to 25MB. Try compressing or splitting the file." },
      { status: 400 }
    );
  }

  const mime = file.type || "";
  const isVideo = VIDEO_MIME.has(mime);
  const isAudio = AUDIO_MIME.has(mime);
  if (!isVideo && !isAudio) {
    return NextResponse.json(
      { error: "Unsupported file type. Use MP3, MP4, M4A, WAV, or WEBM." },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server misconfigured — missing OPENAI_API_KEY" }, { status: 500 });
  }

  const sourceType = isVideo ? "video" : "audio";
  const baseTitle = file.name.replace(/\.[^.]+$/, "");

  const source = await createKnowledgeSource({
    uploaded_by: userId,
    title: baseTitle || (isVideo ? "Video upload" : "Audio upload"),
    author: null,
    source_type: sourceType,
    status: "processing",
    file_size: file.size,
  });

  try {
    // Storage upload (non-fatal — matches existing PDF route behavior)
    const storagePath = `audio/${source.id}/${file.name}`;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: storageErr } = await supabaseAdmin.storage
        .from("knowledge")
        .upload(storagePath, buffer, { contentType: mime || "application/octet-stream" });
      if (storageErr) {
        console.warn("[admin/video/api] storage error (non-fatal):", storageErr.message);
      } else {
        const fileUrl = supabaseAdmin.storage.from("knowledge").getPublicUrl(storagePath).data.publicUrl;
        await updateKnowledgeSource(source.id, { file_url: fileUrl });
      }
    } catch (err) {
      console.warn("[admin/video/api] storage threw (non-fatal):", err instanceof Error ? err.message : err);
    }

    // Whisper transcription
    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });
    const text = (typeof transcription === "string" ? transcription : "").trim();

    if (!text) {
      throw new Error("Whisper returned an empty transcript");
    }

    const meta = await extractMetadata(text);
    await updateKnowledgeSource(source.id, {
      topics: meta.topics,
      conditions: meta.conditions,
      key_concepts: meta.key_concepts,
      summary: meta.summary,
    });

    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    await insertChunks(
      source.id,
      chunks.map((content, i) => ({ content, chunk_index: i, embedding: embeddings[i] }))
    );
    await updateKnowledgeSource(source.id, { status: "analyzed", chunk_count: chunks.length });

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      chunkCount: chunks.length,
      sourceType,
    });
  } catch (err) {
    console.error("[admin/video/api] processing error:", err);
    await updateKnowledgeSource(source.id, {
      status: "failed",
      error_message: err instanceof Error ? err.message : "Processing failed",
    });
    throw err;
  }
}
