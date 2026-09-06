function retired() {
  return Response.json(
    { status: "error", code: "feature_retired", message: "抠图精修已停用。" },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  return retired();
}
export async function POST() {
  return retired();
}
