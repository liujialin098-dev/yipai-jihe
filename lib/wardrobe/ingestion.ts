import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const WARDROBE_BUCKET = "wardrobe-images";

export type IngestionRouteContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

export async function getIngestionRouteContext(): Promise<IngestionRouteContext | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (error || !userId) return null;
    return { supabase, userId };
  } catch {
    return null;
  }
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, ...details } },
    { status },
  );
}

export async function safeRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function removeIngestionObject(
  context: IngestionRouteContext,
  imagePath: string,
) {
  const { error } = await context.supabase.storage
    .from(WARDROBE_BUCKET)
    .remove([imagePath]);
  return !error;
}

export async function cleanupExpiredIngestions(context: IngestionRouteContext) {
  const { data } = await context.supabase
    .from("wardrobe_ingestions")
    .select("id, image_path")
    .eq("user_id", context.userId)
    .neq("status", "confirmed")
    .lte("expires_at", new Date().toISOString())
    .limit(20);

  if (!data || data.length === 0) return 0;
  const paths = data.map((item) => item.image_path);
  const { error: storageError } = await context.supabase.storage
    .from(WARDROBE_BUCKET)
    .remove(paths);
  if (storageError) return 0;

  const { error: deleteError } = await context.supabase
    .from("wardrobe_ingestions")
    .delete()
    .eq("user_id", context.userId)
    .in(
      "id",
      data.map((item) => item.id),
    );
  return deleteError ? 0 : data.length;
}

export async function storageObjectExists(
  context: IngestionRouteContext,
  imagePath: string,
) {
  const parts = imagePath.split("/");
  const fileName = parts.pop();
  if (!fileName || parts.length === 0) return false;

  const { data, error } = await context.supabase.storage
    .from(WARDROBE_BUCKET)
    .list(parts.join("/"), { limit: 1, search: fileName });
  return !error && Boolean(data?.some((item) => item.name === fileName));
}
