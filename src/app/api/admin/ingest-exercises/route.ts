import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fetchAllExercises, type ExerciseRecord } from '@/lib/exercise-source';

// Catalog ingestion can run for a while; give it room.
export const runtime = 'nodejs';
export const maxDuration = 300;

const UPSERT_BATCH = 500;

/** Constant-time secret check. The caller must present the service-role key. */
function authorized(req: NextRequest): boolean {
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const provided = req.headers.get('x-ingest-key') ?? '';
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'FORBIDDEN — valid x-ingest-key required' }, { status: 403 });
  }

  // Upsert EACH page as it arrives so a run cut short by maxDuration/quota still
  // persists everything it fetched (idempotent on id).
  const seen = new Set<string>();
  let upserted = 0;
  const stampedNow = new Date().toISOString();

  async function upsertPage(pageRows: ExerciseRecord[]): Promise<void> {
    const fresh = pageRows.filter((r) => !seen.has(r.id));
    fresh.forEach((r) => seen.add(r.id));
    for (let i = 0; i < fresh.length; i += UPSERT_BATCH) {
      const chunk = fresh.slice(i, i + UPSERT_BATCH).map((r) => ({ ...r, updated_at: stampedNow }));
      const { error } = await supabaseAdmin.from('exercises').upsert(chunk, { onConflict: 'id' });
      if (error) throw new Error(`Upsert failed (offset chunk ${i}): ${error.message}`);
      upserted += chunk.length;
    }
  }

  try {
    const fetched = await fetchAllExercises({ onRows: upsertPage });

    return NextResponse.json({
      ok: true,
      fetched: fetched.length,
      distinct: seen.size,
      upserted,
    });
  } catch (err) {
    // Pages already upserted are persisted; report how far we got.
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message, upserted, distinct: seen.size }, { status: 500 });
  }
}
