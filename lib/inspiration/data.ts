import { cache } from "react";
import { getViewer } from "@/lib/auth/viewer";
import { getFashionContentSnapshot } from "@/lib/inspiration/content";
import {
  type RankedFashionContent,
  selectFashionFeed,
} from "@/lib/inspiration/ranking";
import { rewriteFashionEntries } from "@/lib/inspiration/summary";
import {
  FASHION_TOPICS,
  type FashionPreferences,
  isFashionTopic,
} from "@/lib/inspiration/validation";
import {
  allowedWardrobeAudiences,
  isClothingPreference,
} from "@/lib/personalization/constants";
import { storedWeatherLocation } from "@/lib/recommendations/location";
import { getEffectiveWeatherLocation } from "@/lib/recommendations/location-context";
import { getWeatherSnapshot } from "@/lib/recommendations/weather";
import { createClient } from "@/lib/supabase/server";

export type FashionFeedCard = RankedFashionContent & {
  isRead: boolean;
  isDiscovery: boolean;
};

export type FashionFeedData = {
  items: FashionFeedCard[];
  preferences: FashionPreferences;
  unreadCount: number;
  weatherUsed: boolean;
  sourceUnavailable: boolean;
};

const defaultPreferences: FashionPreferences = {
  topics: [...FASHION_TOPICS],
  personalized: true,
  unreadEnabled: true,
};

export const getFashionFeedData = cache(
  async (summarize = true): Promise<FashionFeedData> => {
    const viewer = await getViewer();
    if (!viewer)
      return {
        items: [],
        preferences: defaultPreferences,
        unreadCount: 0,
        weatherUsed: false,
        sourceUnavailable: false,
      };

    const supabase = await createClient();
    const [
      content,
      readsResult,
      wardrobeResult,
      diaryResult,
      impressionsResult,
    ] = await Promise.all([
      getFashionContentSnapshot(),
      supabase
        .from("fashion_content_reads")
        .select("content_id")
        .eq("user_id", viewer.userId),
      viewer.fashionPersonalized
        ? supabase
            .from("wardrobe_items")
            .select("category, style")
            .eq("user_id", viewer.userId)
            .eq("status", "active")
            .in(
              "audience",
              allowedWardrobeAudiences(
                isClothingPreference(viewer.clothingPreference)
                  ? viewer.clothingPreference
                  : "unrestricted",
              ),
            )
            .limit(120)
        : Promise.resolve({ data: [], error: null }),
      viewer.fashionPersonalized
        ? supabase
            .from("outfit_diary_entries")
            .select("occasion")
            .eq("user_id", viewer.userId)
            .order("worn_on", { ascending: false })
            .gte(
              "worn_on",
              new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
            )
            .limit(5)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("fashion_topic_impressions")
        .select("topic_key, content_id, first_seen_at")
        .eq("user_id", viewer.userId)
        .gt(
          "first_seen_at",
          new Date(Date.now() - 30 * 86_400_000).toISOString(),
        ),
    ]);
    if (readsResult.error || impressionsResult.error)
      throw new Error("灵感阅读记录暂不可用，请稍后重试。");

    const topics = viewer.fashionTopics.filter(isFashionTopic);
    const preferences: FashionPreferences = {
      topics: topics.length > 0 ? topics : [...FASHION_TOPICS],
      personalized: viewer.fashionPersonalized,
      unreadEnabled: viewer.fashionUnreadEnabled,
    };

    let weather: {
      city: string;
      summary: string;
      apparentTemperatureC: number;
      weatherCode: number;
    } | null = null;
    if (preferences.personalized) {
      try {
        const { effectiveLocation } = await getEffectiveWeatherLocation(
          viewer.userId,
          storedWeatherLocation({
            weather_city: viewer.weatherCity,
            weather_admin1: viewer.weatherAdmin1,
            weather_latitude: viewer.weatherLatitude,
            weather_longitude: viewer.weatherLongitude,
            weather_timezone: viewer.weatherTimezone,
          }),
        );
        const snapshot = effectiveLocation
          ? await getWeatherSnapshot("today", effectiveLocation)
          : null;
        if (snapshot)
          weather = {
            city: snapshot.city,
            summary: snapshot.summary,
            apparentTemperatureC: snapshot.apparentTemperatureC,
            weatherCode: snapshot.weatherCode,
          };
      } catch {
        weather = null;
      }
    }

    const readIds = new Set(
      (readsResult.data ?? []).map((row) => row.content_id),
    );
    const ranked = selectFashionFeed({
      items: content.items,
      impressions: impressionsResult.data ?? [],
      preferences,
      viewer,
      wardrobe: wardrobeResult.data ?? [],
      weather,
      recentOccasions: (diaryResult.data ?? []).map((entry) => entry.occasion),
    });
    // Translate only the cards that will actually be displayed.
    const translated = summarize ? await rewriteFashionEntries(ranked) : ranked;
    const titles = new Map(translated.map((item) => [item.id, item]));
    const items = ranked.map((item) => ({
      ...item,
      ...titles.get(item.id),
      isRead: readIds.has(item.id),
    }));
    return {
      items,
      preferences,
      unreadCount: preferences.unreadEnabled
        ? items.filter((item) => !item.isRead).length
        : 0,
      weatherUsed: Boolean(weather),
      sourceUnavailable: content.unavailableSources.length > 0,
    };
  },
);

export async function getFashionUnreadCount() {
  try {
    return (await getFashionFeedData()).unreadCount;
  } catch {
    return 0;
  }
}
