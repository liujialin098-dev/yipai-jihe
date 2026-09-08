import { AuthEntryGateway } from "@/components/auth/auth-entry-gateway";
import { DailyEdit } from "@/components/home/daily-edit";
import { getViewer } from "@/lib/auth/viewer";
import { getDiaryMonthData } from "@/lib/diary/data";
import { dateInTimeZone } from "@/lib/diary/validation";
import { recentHomeDays } from "@/lib/home/presentation";
import { getRecommendationPageData } from "@/lib/recommendations/data";

const entryFeedback = {
  "anonymous-unavailable": "暂时无法建立体验身份，请稍后重试。",
  "signed-out": "已退出当前身份。使用原邮箱登录可以找回已注册衣橱。",
} as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  if (!viewer) {
    const feedbackKey = params.error ?? params.status;
    const feedback =
      feedbackKey && feedbackKey in entryFeedback
        ? entryFeedback[feedbackKey as keyof typeof entryFeedback]
        : null;
    return <AuthEntryGateway feedback={feedback} />;
  }
  const today = dateInTimeZone(
    new Date(),
    viewer.weatherTimezone ?? "Asia/Shanghai",
  );
  const days = recentHomeDays(today);
  const months = [...new Set(days.map((date) => date.slice(0, 7)))];
  const [data, diaryMonths] = await Promise.all([
    getRecommendationPageData("today"),
    Promise.all(months.map(getDiaryMonthData)),
  ]);
  return (
    <DailyEdit
      data={data}
      days={days}
      entries={diaryMonths.flatMap((month) => month?.entries ?? [])}
      diaryError={diaryMonths.some((month) => !month || Boolean(month.error))}
      anonymous={viewer.isAnonymous}
      displayName={viewer.displayName}
    />
  );
}
