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

const SIGNED_URL_TTL_SECONDS = 60 * 30;
const SIGNED_URL_CACHE_MS = 60 * 25 * 1000;
const SIGNED_URL_CACHE_LIMIT = 512;
const signedUrlCache = new Map<
  string,
  { expiresAt: number; signedUrl: string }
>();

async function signedUrlMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  const uniquePaths = [...new Set(paths)];
  if (uniquePaths.length === 0) return new Map<string, string>();

  const now = Date.now();
  const urls = new Map<string, string>();
  const missingPaths = uniquePaths.filter((path) => {
    const cached = signedUrlCache.get(path);
    if (!cached || cached.expiresAt <= now) {
      signedUrlCache.delete(path);
      return true;
    }

    urls.set(path, cached.signedUrl);
    return false;
  });

  if (missingPaths.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from("wardrobe-images")
    .createSignedUrls(missingPaths, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return urls;

  for (const entry of data) {
    if (!entry.path || !entry.signedUrl) continue;
    urls.set(entry.path, entry.signedUrl);

    if (
      signedUrlCache.size >= SIGNED_URL_CACHE_LIMIT &&
      !signedUrlCache.has(entry.path)
    ) {
      const oldestPath = signedUrlCache.keys().next().value;
      if (oldestPath) signedUrlCache.delete(oldestPath);
    }

    signedUrlCache.set(entry.path, {
      expiresAt: now + SIGNED_URL_CACHE_MS,
      signedUrl: entry.signedUrl,
    });
  }

  return urls;
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
