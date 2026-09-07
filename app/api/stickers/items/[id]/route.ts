import { revalidatePath } from "next/cache";
import { processProfessionalCutout } from "@/lib/outfits/professional-cutout";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/wardrobe/validation";

export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Origin",
};

function failure(error: string, status: number) {
  return Response.json({ error }, { status, headers: responseHeaders });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const url = new URL(request.url);
  if (
    request.headers.get("origin") !== url.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return failure("request_forbidden", 403);
  }

  const { id } = await context.params;
  if (!isUuid(id)) return failure("item_invalid", 400);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return failure("session_required", 401);

    const result = await processProfessionalCutout({
      itemId: id,
      supabase,
      userId: data.user.id,
    });
    if (result.status === "error") {
      if (result.code === "not_found") return failure(result.code, 404);
      if (result.code === "image_invalid" || result.code === "image_missing") {
        return failure(result.code, 422);
      }
      return failure(result.code, 503);
    }

    revalidatePath("/");
    revalidatePath("/wardrobe");
    revalidatePath("/recommendations");
    revalidatePath("/diary");
    revalidatePath("/stickers");

    return Response.json(
      { status: result.status, cutoutUrl: result.cutoutUrl },
      { headers: responseHeaders },
    );
  } catch {
    return failure("cutout_unavailable", 503);
  }
}
