import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "认识你的衣橱" };
export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer || !viewer.needsOnboarding) redirect("/");
  return <OnboardingFlow key={viewer.userId} userId={viewer.userId} />;
}
