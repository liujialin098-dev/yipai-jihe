export async function POST() {
  return Response.json(
    {
      status: "error",
      code: "feature_retired",
      message: "抠图功能已停用，原图仍然保留。",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
