import {
  getIngestionRouteContext,
  jsonError,
  removeIngestionObject,
} from "@/lib/wardrobe/ingestion";
import { isUuid } from "@/lib/wardrobe/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, route: RouteContext) {
  const { id } = await route.params;
  if (!isUuid(id)) return new Response(null, { status: 204 });

  const context = await getIngestionRouteContext();
  if (!context) return jsonError("unauthorized", "会话尚未准备好。", 401);

  const { data: ingestion } = await context.supabase
    .from("wardrobe_ingestions")
    .select("id, image_path, status")
    .eq("id", id)
    .eq("user_id", context.userId)
    .maybeSingle();
  if (!ingestion) return new Response(null, { status: 204 });
  if (ingestion.status === "confirmed") {
    return jsonError("already_confirmed", "已入库衣物请从详情页删除。", 409);
  }

  if (!(await removeIngestionObject(context, ingestion.image_path))) {
    return jsonError(
      "storage_delete_failed",
      "暂时无法移除原图，请重试。",
      500,
    );
  }

  const { error } = await context.supabase
    .from("wardrobe_ingestions")
    .delete()
    .eq("id", id)
    .eq("user_id", context.userId);
  if (error) return jsonError("delete_failed", "清理记录失败，请重试。", 500);
  return new Response(null, { status: 204 });
}
