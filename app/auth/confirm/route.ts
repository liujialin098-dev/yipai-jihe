import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedDestinations = new Set(["/settings", "/login"]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/settings";
  const next = allowedDestinations.has(requestedNext)
    ? requestedNext
    : "/settings";
  const supabase = await createClient();

  let error: Error | null = null;
  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    const claimsResult = await supabase.auth.getClaims();
    error = claimsResult.error;
  }

  const destination = request.nextUrl.clone();
  destination.pathname = error ? "/login" : next;
  destination.search = "";
  destination.searchParams.set(
    error ? "error" : "binding",
    error ? "invalid-link" : "verified",
  );
  return NextResponse.redirect(destination);
}
