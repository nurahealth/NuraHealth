// Context-aware back navigation for the Recipes / Foods routes.
//
// Detail pages can be reached from more than one place (e.g. the foods grid OR
// a recipe's "Full food profile" link). Rather than a hard-coded back target,
// callers pass `?from=<internal-path>&label=<text>` and the destination renders
// "← <label>" pointing at <from>. We only honor internal paths (leading "/",
// not "//") so the link can't be pointed off-site.

export type RawSearchParam = string | string[] | undefined;

export interface BackTarget {
  href: string;
  label: string;
}

function first(v: RawSearchParam): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function resolveBack(
  searchParams: { from?: RawSearchParam; label?: RawSearchParam },
  fallback: BackTarget
): BackTarget {
  const from = first(searchParams.from);
  const label = first(searchParams.label);
  if (from && from.startsWith("/") && !from.startsWith("//")) {
    return { href: from, label: label && label.trim() ? label : fallback.label };
  }
  return fallback;
}

// Build a "/foods/<slug>" (or any detail) href that carries where we came from,
// so the destination's back button can return here with a friendly label.
export function withFrom(href: string, from: string, label: string): string {
  const params = new URLSearchParams({ from, label });
  return `${href}?${params.toString()}`;
}
