// Resilient recipe reads. The optional photo columns — `image_url`
// (20260705000003) and `focal_x`/`focal_y` (20260705000004) — only exist once
// their migrations are applied. Selecting a column that doesn't exist errors the
// ENTIRE query, which 404s / empties every recipe page. This helper tries the
// richest column set and progressively drops the optional columns until the
// query succeeds, so recipe pages render (gradient fallback, centered crop)
// regardless of which migrations have run yet.

function isMissingColumn(err: { code?: string } | null): boolean {
  // Base columns always exist, so a 42703 / PGRST204 here can only be one of the
  // optional photo columns.
  if (!err) return false;
  return err.code === "42703" || err.code === "PGRST204";
}

// Column tiers, richest → poorest. `extraCols` is spliced into the caller's
// select list (top-level `, image_url, …` or inside an embedded resource).
const TIERS = [", image_url, focal_x, focal_y", ", image_url", ""];

export async function withImageUrlFallback<T>(
  build: (extraCols: string) => PromiseLike<{ data: unknown; error: { code?: string } | null }>,
): Promise<T | null> {
  for (let i = 0; i < TIERS.length; i++) {
    const res = await build(TIERS[i]);
    if (!res.error) return (res.data ?? null) as T | null;
    // Only step down when it's a missing-column error and we still have tiers left.
    if (!isMissingColumn(res.error) || i === TIERS.length - 1) {
      return (res.data ?? null) as T | null;
    }
  }
  return null;
}
