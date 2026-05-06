import { supabase } from "./supabase";

export type SavedItemType = "protocol" | "stack" | "insight" | "chat";

export interface SavedItem {
  id: string;
  user_id: string;
  type: SavedItemType;
  title: string;
  description: string | null;
  content: string | null;
  source_chat_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface SavedItemCounts {
  all: number;
  protocol: number;
  stack: number;
  insight: number;
  chat: number;
}

export async function getUserSavedItems(
  userId: string,
  typeFilter?: SavedItemType
): Promise<SavedItem[]> {
  let query = supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (typeFilter) {
    query = query.eq("type", typeFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SavedItem[];
}

export async function saveItem(
  userId: string,
  data: {
    type: SavedItemType;
    title: string;
    description?: string;
    content?: string;
    source_chat_id?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<SavedItem> {
  const { data: item, error } = await supabase
    .from("saved_items")
    .insert({
      user_id: userId,
      type: data.type,
      title: data.title,
      description: data.description ?? null,
      content: data.content ?? null,
      source_chat_id: data.source_chat_id ?? null,
      metadata: data.metadata ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return item as SavedItem;
}

export async function updateSavedItem(
  itemId: string,
  data: Partial<Pick<SavedItem, "title" | "description" | "content" | "metadata">>
): Promise<SavedItem> {
  const { data: item, error } = await supabase
    .from("saved_items")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return item as SavedItem;
}

export async function deleteSavedItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("saved_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function getSavedItemCounts(userId: string): Promise<SavedItemCounts> {
  const { data, error } = await supabase
    .from("saved_items")
    .select("type")
    .eq("user_id", userId);
  if (error) throw error;
  const items = (data ?? []) as { type: string }[];
  return {
    all: items.length,
    protocol: items.filter((i) => i.type === "protocol").length,
    stack: items.filter((i) => i.type === "stack").length,
    insight: items.filter((i) => i.type === "insight").length,
    chat: items.filter((i) => i.type === "chat").length,
  };
}
