import { NextResponse } from "next/server";
import { FIRST_USE_METADATA } from "@/lib/onboarding/model";
import { SupabaseConfigError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const responseOptions = {
  headers: { "Cache-Control": "no-store" },
};

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    let userId = claimsData?.claims?.sub;
    let isAnonymous = claimsData?.claims?.is_anonymous === true;

    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously({
        options: { data: FIRST_USE_METADATA },
      });

      if (error || !data.user) {
        return NextResponse.json(
          {
            message: "暂时无法建立体验身份，请稍后重试。",
            retryable: true,
          },
          { ...responseOptions, status: 503 },
        );
      }

      userId = data.user.id;
      isAnonymous = true;
    }

    const [profileResult, preferencesResult] = await Promise.all([
      supabase
        .from("profiles")
        .upsert(
          { user_id: userId },
          { ignoreDuplicates: true, onConflict: "user_id" },
        ),
      supabase
        .from("user_preferences")
        .upsert(
          { user_id: userId },
          { ignoreDuplicates: true, onConflict: "user_id" },
        ),
    ]);

    if (profileResult.error || preferencesResult.error) {
      return NextResponse.json(
        {
          message: "身份已经建立，但衣橱资料还没准备好。请重试一次。",
          retryable: true,
        },
        { ...responseOptions, status: 500 },
      );
    }

    return NextResponse.json(
      { initialized: true, isAnonymous, userId },
      responseOptions,
    );
  } catch (error) {
    const message =
      error instanceof SupabaseConfigError
        ? error.message
        : "连接暂时不可用，请检查网络后重试。";

    return NextResponse.json(
      { message, retryable: true },
      { ...responseOptions, status: 503 },
    );
  }
}
