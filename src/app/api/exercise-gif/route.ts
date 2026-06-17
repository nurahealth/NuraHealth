import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// WorkoutX GIFs require the X-WorkoutX-Key header — a plain <img src> can't send
// it, so the browser gets 401 and we'd only ever see the placeholder. This route
// fetches the GIF server-side with the key and streams the bytes back.
//
//   /api/exercise-gif?id=0001         → builds the canonical gif URL from the id
//   /api/exercise-gif?url=<gif_url>   → proxies a stored gif_url (host-allowlisted)
//
// GIFs are content-addressed by id (immutable), so we cache hard to spare the
// monthly API quota — each unique GIF is fetched from WorkoutX at most once per
// cache lifetime, not on every page view.

const BASE_URL = (process.env.WORKOUTX_BASE_URL ?? 'https://api.workoutxapp.com').replace(/\/+$/, '');
const ALLOWED_HOST = new URL(BASE_URL).host;

export async function GET(req: NextRequest): Promise<Response> {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  const rawUrl = sp.get('url');

  // Resolve the upstream URL, restricted to the WorkoutX host (no open proxy).
  let target: string;
  if (id) {
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    target = `${BASE_URL}/v1/gifs/${id}.gif`;
  } else if (rawUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }
    if (parsed.protocol !== 'https:' || parsed.host !== ALLOWED_HOST) {
      return NextResponse.json({ error: 'Disallowed host' }, { status: 400 });
    }
    target = parsed.toString();
  } else {
    return NextResponse.json({ error: 'Missing id or url' }, { status: 400 });
  }

  const key = process.env.WORKOUTX_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'WorkoutX key not configured' }, { status: 500 });
  }

  const upstream = await fetch(target, { headers: { 'X-WorkoutX-Key': key } });
  if (!upstream.ok || !upstream.body) {
    // Let the client fall back to the placeholder figure.
    return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/gif';
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      // Immutable, content-addressed asset — cache for a year.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
