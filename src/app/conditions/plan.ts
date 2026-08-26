// ─────────────────────────────────────────────────────────────────────────────
// "Add protocol to my plan" — persistence.
//
// This reuses the EXISTING saved-items store (`saved_items`, the table behind
// /saved) rather than introducing a table of its own. A saved protocol is a row
// of type "protocol" tagged in metadata with the condition slug, so it shows up
// on the Saved screen alongside everything else the user has kept, with no
// migration and no schema change.
// ─────────────────────────────────────────────────────────────────────────────

import { getUserSavedItems, saveItem, deleteSavedItem, type SavedItem } from "@/lib/saved";
import type { Condition } from "./data";

const SOURCE = "conditions";

interface ProtocolMeta {
  source?: string;
  conditionSlug?: string;
}

/** The saved row for this condition, if the user already added it. */
export async function findSavedProtocol(
  userId: string,
  slug: string
): Promise<SavedItem | null> {
  const items = await getUserSavedItems(userId, "protocol");
  const hit = items.find((i) => {
    const meta = (i.metadata ?? {}) as ProtocolMeta;
    return meta.source === SOURCE && meta.conditionSlug === slug;
  });
  return hit ?? null;
}

/** Plain-text body so the Saved screen shows the protocol, not just its name. */
function renderContent(condition: Condition): string {
  const lines = condition.steps.map((s, i) => {
    const doctor = s.supervised ? " — talk to your doctor first" : "";
    return `${i + 1}. ${s.title}${doctor}\n   ${s.why}\n   Evidence ${s.grade} · ${s.gradeNote}`;
  });
  return [condition.intro, "", ...lines, "", "Wellness information · Not medical advice · Never a replacement for your doctor."].join("\n");
}

export async function addProtocolToPlan(
  userId: string,
  condition: Condition
): Promise<SavedItem> {
  return saveItem(userId, {
    type: "protocol",
    title: condition.name,
    description: condition.blurb,
    content: renderContent(condition),
    metadata: {
      source: SOURCE,
      conditionSlug: condition.slug,
      stepCount: condition.steps.length,
      href: `/conditions/${condition.slug}`,
    },
  });
}

export async function removeProtocolFromPlan(itemId: string): Promise<void> {
  await deleteSavedItem(itemId);
}
