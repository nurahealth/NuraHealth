// Resilient recipe reads. The `recipes.image_url` column only exists once its
// migration (20260705000003_recipes_image_url.sql) has been applied. Until then,
// selecting it errors the ENTIRE query (PostgREST 42703 / PGRST204), which
// returns null data and 404s / empties every recipe page. This helper runs the
// select WITH image_url and, if that column is missing, transparently retries
// WITHOUT it — so recipe pages render (falling back to the sage gradient)
// regardless of whether the migration has run yet.

function isMissingImageColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  return (code === "42703" || code === "PGRST204") && (err.message ?? "").includes("image_url");
}

// `build(imageCol)` must construct the query with `imageCol` spliced into its
// select list — either ", image_url" (top-level) or the same inside an embedded
// resource, e.g. `recipes(id, slug, ...${imageCol})`.
export async function withImageUrlFallback<T>(
  build: (imageCol: string) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>,
): Promise<T | null> {
  const withImg = await build(", image_url");
  if (!withImg.error) return (withImg.data ?? null) as T | null;
  if (isMissingImageColumn(withImg.error)) {
    const without = await build("");
    return (without.data ?? null) as T | null;
  }
  return (withImg.data ?? null) as T | null;
}
