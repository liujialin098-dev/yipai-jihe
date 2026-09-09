import { ArrowLeft, Heart, RefreshCw, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { PreferenceForm } from "@/components/preferences/preference-form";
import { getViewer } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import {
  OCCASION_OPTIONS,
  STYLE_OPTIONS,
  optionLabel,
} from "@/lib/wardrobe/constants";

function normalizedDefaults(
  options: readonly { value: string; label: string }[],
  values: string[] | null | undefined,
  fallback: string[],
) {
  const normalized = Array.from(
    new Set(
      (values ?? []).flatMap((value) => {
        const option = options.find(
          (candidate) => candidate.value === value || candidate.label === value,
        );
        return option ? [option.value] : [];
      }),
    ),
  ).slice(0, 3);
  return normalized.length > 0 ? normalized : fallback;
}

export default async function PreferencesPage() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createClient();
  const [preferenceResult, eventsResult] = await Promise.all([
    supabase
      .from("user_preferences")
      .select(
        "preference_state, preference_focus, preferred_styles, preferred_occasions, style_scores, clothing_preference, weather_city, weather_admin1",
      )
      .eq("user_id", viewer.userId)
      .single(),
    supabase
      .from("preference_feedback_events")
      .select("event_type")
      .eq("user_id", viewer.userId),
  ]);
  const preference = preferenceResult.data;
  const scores =
    preference?.style_scores &&
    typeof preference.style_scores === "object" &&
    !Array.isArray(preference.style_scores)
      ? preference.style_scores
      : {};
  const eventCounts = (eventsResult.data ?? []).reduce<Record<string, number>>(
    (counts, event) => {
      counts[event.event_type] = (counts[event.event_type] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return (
    <div className="page-enter px-5 pt-3">
      <Link
        href="/settings"
        aria-label="返回设置"
        className="liquid-glass-web pressable inline-flex size-10 items-center justify-center rounded-full"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
      </Link>
      <h1 className="app-page-title mt-5">穿衣偏好</h1>

      <section className="surface-card mt-6 rounded-[1.65rem] p-5">
        <PreferenceForm
          defaultStyles={normalizedDefaults(
            STYLE_OPTIONS,
            preference?.preferred_styles,
            ["minimal", "casual"],
          )}
          defaultOccasions={normalizedDefaults(
            OCCASION_OPTIONS.filter((option) => option.value !== "sport"),
            preference?.preferred_occasions,
            ["casual", "commute"],
          )}
          defaultFocus={preference?.preference_focus ?? "versatile"}
          defaultCity={preference?.weather_city ?? ""}
          defaultAdmin1={preference?.weather_admin1 ?? ""}
          defaultClothingPreference={
            preference?.clothing_preference ?? "unrestricted"
          }
        />
      </section>

      <section className="surface-card mt-5 rounded-[1.65rem] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="app-section-title">当前风格排序</h2>
          <span className="rounded-full bg-[var(--system-blue-soft)] px-3 py-1 text-[0.68rem] font-semibold text-[var(--system-blue)]">
            {preference?.preference_state === "completed"
              ? "已完成问卷"
              : preference?.preference_state === "skipped"
                ? "使用默认"
                : "待初始化"}
          </span>
        </div>
        <div className="mt-4 grid gap-2">
          {STYLE_OPTIONS.map((style) => (
            <div
              key={style.value}
              className="flex items-center justify-between rounded-[1rem] bg-[var(--surface-soft)] px-3.5 py-3"
            >
              <span className="text-sm font-medium">{style.label}</span>
              <span className="text-xs font-semibold text-[var(--system-blue)]">
                {Number(scores[style.value] ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-card mt-5 rounded-[1.65rem] p-5">
        <h2 className="app-section-title">调整依据</h2>
        <div className="mt-4 grid gap-3">
          <SourceRow
            icon={SlidersHorizontal}
            label="问卷选择"
            value={`${eventCounts.questionnaire ?? 0} 条`}
          />
          <SourceRow
            icon={Heart}
            label="收藏与取消"
            value={`${(eventCounts.favorite_item ?? 0) + (eventCounts.unfavorite_item ?? 0) + (eventCounts.favorite_outfit ?? 0) + (eventCounts.unfavorite_outfit ?? 0)} 条`}
          />
          <SourceRow
            icon={RefreshCw}
            label="换入单品"
            value={`${eventCounts.replace ?? 0} 条`}
          />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--text-tertiary)]">
          当前优先：
          {(preference?.preferred_styles ?? [])
            .map((style) => optionLabel(STYLE_OPTIONS, style))
            .join("、") || "尚未形成"}
          。换出的衣物不会被自动标记为不喜欢。
        </p>
      </section>
    </div>
  );
}

function SourceRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] bg-[var(--surface-soft)] px-3.5 py-3">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-[var(--system-blue)]" aria-hidden="true" />
        {label}
      </span>
      <span className="text-xs text-[var(--text-tertiary)]">{value}</span>
    </div>
  );
}
