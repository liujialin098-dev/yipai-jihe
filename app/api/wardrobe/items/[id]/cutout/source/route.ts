import { NextResponse } from "next/server";
import {
  professionalSourcePath,
  saveRefinedCutout,
} from "@/lib/outfits/professional-cutout";
import { createClient } from "@/lib/supabase/server";
import { WARDROBE_BUCKET, jsonError } from "@/lib/wardrobe/ingestion";
import { isUuid } from "@/lib/wardrobe/validation";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_REFINEMENT_BYTES = 20 * 1024 * 1024;

export async function GET(request: Request, route: RouteContext) {
  const context = await getOwnedItem(route);
  if (context instanceof Response) return context;
  const { item, supabase } = context;
  const asset = new URL(request.url).searchParams.get("asset");
  if (asset === "original") {
    const original = await supabase.storage
      .from(WARDROBE_BUCKET)
      .download(item.image_path);
    if (original.error || !original.data) {
      return jsonError("image_missing", "衣物原图暂时无法读取。", 404);
    }
    return new NextResponse(original.data, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": original.data.type || "application/octet-stream",
      },
    });
  }
  if (!item.cutout_path) {
    return jsonError(
      "source_missing",
      "请先完成一次专业抠图，再进行边缘精修。",
      404,
    );
  }
  const source = await supabase.storage
    .from(WARDROBE_BUCKET)
    .download(professionalSourcePath(item.cutout_path));
  if (source.error || !source.data) {
    return jsonError(
      "source_missing",
      "这张透明图没有可恢复工作图，请先重新执行专业抠图。",
      404,
    );
  }
  return new NextResponse(source.data, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "image/png",
    },
  });
}

export async function PUT(request: Request, route: RouteContext) {
  const contentType = request.headers.get("content-type")?.toLowerCase();
  if (!contentType?.startsWith("image/png")) {
    return jsonError("image_invalid", "精修结果必须是 PNG 图片。", 400);
  }
  const context = await getOwnedItem(route);
  if (context instanceof Response) return context;
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength < 1 || bytes.byteLength > MAX_REFINEMENT_BYTES) {
    return jsonError("image_invalid", "精修图片大小无效。", 400);
  }
  const result = await saveRefinedCutout({
    itemId: context.item.id,
    source: new Blob([bytes], { type: "image/png" }),
    supabase: context.supabase,
    userId: context.userId,
  });
  if (result.status === "error") {
    return jsonError(
      result.code,
      "精修结果暂时无法保存，当前透明图没有被覆盖。",
      result.code === "not_found" ? 404 : 503,
    );
  }
  return NextResponse.json({
    status: "created",
    cutoutUrl: result.cutoutUrl,
    message: "边缘精修已保存。",
  });
}

async function getOwnedItem(route: RouteContext) {
  const { id } = await route.params;
  if (!isUuid(id)) return jsonError("not_found", "未找到这件衣物。", 404);
  const supabase = await createClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;
  if (userResult.error || !user) {
    return jsonError("unauthorized", "登录状态已失效，请刷新后重试。", 401);
  }
  const itemResult = await supabase
    .from("wardrobe_items")
    .select("id, image_path, cutout_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (itemResult.error || !itemResult.data) {
    return jsonError("not_found", "未找到这件衣物。", 404);
  }
  return {
    item: itemResult.data,
    supabase,
    userId: user.id,
  };
}
