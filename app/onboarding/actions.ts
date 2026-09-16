"use server";

import { revalidatePath } from "next/cache";
import { type OnboardingResult, saveFirstUse } from "@/lib/onboarding/save";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(
  input: unknown,
): Promise<OnboardingResult> {
  try {
    const result = await saveFirstUse(await createClient(), input);
    if (result.ok) revalidatePath("/", "layout");
    return result;
  } catch {
    return { ok: false, message: "连接暂时不可用，选择已保留，请重试。" };
  }
}
