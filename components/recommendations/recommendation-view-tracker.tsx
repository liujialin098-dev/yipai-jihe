"use client";

import { useEffect } from "react";
import { recordRecommendationView } from "@/app/recommendations/actions";

export function RecommendationViewTracker({
  recommendationId,
  version,
}: {
  recommendationId: string;
  version: string;
}) {
  useEffect(() => {
    void recordRecommendationView(recommendationId, version);
  }, [recommendationId, version]);
  return null;
}
