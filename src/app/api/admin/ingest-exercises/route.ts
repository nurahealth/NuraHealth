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

  try {
    // 1. Pull the full catalog from the source (paginated, mapped centrally).
    const fetched = await fetchAllExercises();

    // 2. Dedupe by id (the API may repeat rows across page boundaries).
    const byId = new Map<string, ExerciseRecord>();
    for (const ex of fetched) byId.set(ex.id, ex);
    const rows = [...byId.values()];

    // 3. Idempotent upsert via the service role (bypasses RLS) in batches.
    const stampedNow = new Date().toISOString();
    let upserted = 0;
    for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
      const chunk = rows.slice(i, i + UPSERT_BATCH).map((r) => ({ ...r, updated_at: stampedNow }));
      const { error } = await supabaseAdmin
        .from('exercises')
        .upsert(chunk, { onConflict: 'id' });
      if (error) {
        return NextResponse.json(
          { error: `Upsert failed at row ${i}: ${error.message}`, upserted },
          { status: 500 },
        );
      }
      upserted += chunk.length;
    }

    return NextResponse.json({
      ok: true,
      fetched: fetched.length,
      distinct: rows.length,
      upserted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
