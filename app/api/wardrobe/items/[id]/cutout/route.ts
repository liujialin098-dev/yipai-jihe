import { NextResponse } from "next/server";
import { processProfessionalCutout } from "@/lib/outfits/professional-cutout";
import { createClient } from "@/lib/supabase/server";
import { jsonError, safeRequestJson } from "@/lib/wardrobe/ingestion";
import { isUuid } from "@/lib/wardrobe/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, route: RouteContext) {
  const { id } = await route.params;
  if (!isUuid(id)) return jsonError("not_found", "未找到这件衣物。", 404);

  const body = await safeRequestJson(request);
  if (
    body !== null &&
    (typeof body !== "object" ||
      Array.isArray(body) ||
      ("force" in body && typeof body.force !== "boolean"))
  ) {
    return jsonError("invalid_request", "抠图请求无效。", 400);
  }
  const force = Boolean(
    body && typeof body === "object" && "force" in body && body.force,
  );

  const supabase = await createClient();
  const userResult = await supabase.auth.getUser();
  const user = userResult.data.user;
  if (userResult.error || !user) {
    return jsonError("unauthorized", "登录状态已失效，请刷新后重试。", 401);
  }

  const result = await processProfessionalCutout({
    force,
    itemId: id,
    supabase,
    userId: user.id,
  });
  if (result.status === "error") {
    if (result.code === "not_found") {
      return jsonError("not_found", "未找到这件衣物。", 404);
    }
    if (result.code === "image_missing") {
      return jsonError("image_missing", "衣物原图暂时无法读取。", 409);
    }
    return jsonError("cutout_unavailable", "抠图失败，请重试。", 503);
  }

  return NextResponse.json({
    status: result.status,
    cutoutUrl: result.cutoutUrl,
    message:
      result.status === "reused" ? "已使用现有透明图。" : "专业抠图已完成。",
  });
}
