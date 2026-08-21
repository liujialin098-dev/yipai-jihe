import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import {
  escapeIlike,
  isUuid,
  type WardrobeFilters,
} from "@/lib/wardrobe/validation";

type WardrobeRow = Tables<"wardrobe_items">;

export type WardrobeItem = Omit<
  WardrobeRow,
  "demo_key" | "image_path" | "user_id"
> & {
  imageUrl: string | null;
};

const ITEM_COLUMNS =
  "id, name, category, primary_color, material, style, seasons, occasions, image_path, status, created_at, updated_at";

async function signedUrlMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  const uniquePaths = [...new Set(paths)];
  if (uniquePaths.length === 0) return new Map<string, string>();

  const { data, error } = await supabase.storage
    .from("wardrobe-images")
    .createSignedUrls(uniquePaths, 60 * 30);

  if (error || !data) return new Map<string, string>();

  return new Map(
    data.flatMap((entry) =>
      entry.signedUrl ? ([[entry.path, entry.signedUrl]] as const) : [],
    ),
  );
}

function toWardrobeItem(
  row: Omit<WardrobeRow, "demo_key" | "user_id">,
  imageUrl: string | null,
): WardrobeItem {
  const { image_path: _imagePath, ...item } = row;
  return { ...item, imageUrl };
}

export async function getWardrobeItems(filters: WardrobeFilters) {
  const viewer = await getViewer();
  if (!viewer) {
    return {
      items: [] as WardrobeItem[],
      error: "匿名会话正在准备，请稍后重试。",
    };
  }

  const supabase = await createClient();
  let query = supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("user_id", viewer.userId)
    .eq("status", filters.status)
    .order("updated_at", { ascending: false });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.color) query = query.eq("primary_color", filters.color);
  if (filters.season) query = query.contains("seasons", [filters.season]);
  if (filters.occasion) {
    query = query.contains("occasions", [filters.occasion]);
  }
  if (filters.q) {
    query = query.ilike("name", `%${escapeIlike(filters.q)}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return {
      items: [] as WardrobeItem[],
      error: "衣橱暂时无法读取，请稍后重试。",
    };
  }

  const urls = await signedUrlMap(
    supabase,
    data.map((item) => item.image_path),
  );

  return {
    items: data.map((item) =>
      toWardrobeItem(item, urls.get(item.image_path) ?? null),
    ),
    error: null,
  };
}

export async function getWardrobeItem(id: string) {
  if (!isUuid(id)) return null;
  const viewer = await getViewer();
  if (!viewer) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select(ITEM_COLUMNS)
    .eq("id", id)
    .eq("user_id", viewer.userId)
    .maybeSingle();

  if (error || !data) return null;
  const urls = await signedUrlMap(supabase, [data.image_path]);
  return toWardrobeItem(data, urls.get(data.image_path) ?? null);
}

export async function getWardrobeCount(
  status: "active" | "archived" = "active",
) {
  const viewer = await getViewer();
  if (!viewer) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.userId)
    .eq("status", status);

  return error ? 0 : (count ?? 0);
}
