'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import FitnessBackButton from '../FitnessBackButton';

// Dev tool: compare the GIF the app actually serves for each exercise (Supabase
// Storage if migrated, else the WorkoutX proxy) against a local sample dropped
// into public/gif-samples/{id}.gif. Resolves at /fitness/gif-compare.

const SAGE = '#9bb0a5';
const TEXT = '#ebe6d8';
const MUT = 'rgba(235,230,216,.5)';
const SURF = 'rgba(235,230,216,.045)';
const LINE = 'rgba(235,230,216,.09)';
const STORAGE_MARKER = '/storage/v1/object/public/';

type Row = { id: string; name: string; gif_url: string | null };

// Same source logic the how-to screen uses: Storage URLs load directly, WorkoutX
// URLs go through the key-injecting proxy.
function servedSrc(gif: string | null): string | null {
  if (!gif) return null;
  return gif.includes(STORAGE_MARKER) ? gif : `/api/exercise-gif?url=${encodeURIComponent(gif)}`;
}
function sourceLabel(gif: string | null): string {
  if (!gif) return 'none';
  return gif.includes(STORAGE_MARKER) ? 'Supabase Storage' : 'WorkoutX (proxy)';
}

function Frame({ src, label, alt }: { src: string | null; label: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '.06em', color: MUT, textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{
        position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden',
        background: SURF, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} onError={() => setFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 11, color: MUT }}>{src ? 'failed to load' : 'no GIF'}</span>
        )}
      </div>
    </div>
  );
}

export default function GifComparePage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('exercises').select('id,name,gif_url').order('id');
      if (!cancelled) { setRows((data as Row[] | null) ?? []); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const onStorage = rows.filter((r) => r.gif_url?.includes(STORAGE_MARKER)).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0e', color: TEXT, fontFamily: "var(--font-inter),system-ui,sans-serif", padding: '24px 18px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <FitnessBackButton onClick={() => router.push('/fitness')} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>GIF compare</h1>
        <p style={{ fontSize: 13.5, color: MUT, lineHeight: 1.6, margin: '0 0 4px' }}>
          Served GIF (Supabase Storage if migrated, else WorkoutX proxy) vs a local
          sample from <code style={{ color: SAGE }}>public/gif-samples/&lt;id&gt;.gif</code>.
        </p>
        <p style={{ fontSize: 12, color: MUT, margin: '0 0 20px' }}>
          {loading ? 'Loading…' : `${rows.length} exercises · ${onStorage} on Storage · ${rows.length - onStorage} on WorkoutX`}
        </p>

        {!loading && rows.length === 0 && (
          <div style={{ fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>
            No exercises returned — make sure you&apos;re signed in (the catalog is read under your session).
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: SAGE }}>{r.id} · {sourceLabel(r.gif_url)}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Frame src={servedSrc(r.gif_url)} label="Served (app)" alt={`${r.name} served`} />
                <Frame src={`/gif-samples/${r.id}.gif`} label="Local sample" alt={`${r.name} local sample`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
