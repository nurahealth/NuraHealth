// MoveKit-only catalog gate.
//
// A "MoveKit-covered" exercise is one whose `gif_url` is a 3D clip in the
// exercise-media/clips bucket (an .mp4/.webm). That is the single source of
// truth for which exercises are ACTIVE and may surface anywhere new — browse,
// search, plan generation, and swaps all filter to it.
//
// Non-MoveKit exercises are NOT deleted: their rows stay in `exercises` so that
// historical workout plans and logs keep resolving (name + placeholder). They
// are simply flagged-inactive-by-omission — never offered in any new surface.
// Reverse the pivot by removing these filters; nothing was destroyed.
//
// Usage: `query.like('gif_url', MOVEKIT_GIF_LIKE)` on any exercises read that
// feeds a browse/search/generate/swap surface.
export const MOVEKIT_GIF_LIKE = "%exercise-media/clips/%";
