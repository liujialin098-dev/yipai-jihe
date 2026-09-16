import { createRoot } from "react-dom/client";
import { AuthEntryGateway } from "@/components/auth/auth-entry-gateway";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { DiaryComposer } from "@/components/diary/diary-composer";

const query = new URLSearchParams(location.search);
document.documentElement.dataset.skin =
  localStorage.getItem("ensemble-skin-v1") ?? "original";
document.documentElement.classList.toggle(
  "dark",
  query.get("theme") === "dark",
);
document.documentElement.classList.toggle(
  "light",
  query.get("theme") !== "dark",
);
if (query.has("large")) document.documentElement.style.fontSize = "20px";
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <div className="app-backdrop">
      <main style={{ maxWidth: 480, margin: "auto" }}>
        {query.has("diary") ? (
          <DiaryComposer
            today="2026-09-16"
            initialEntry={{
              itemIds: [],
              note: "",
              title: "今日穿搭",
              occasion: "casual",
              wornOn: "2026-09-16",
            }}
            items={
              query.has("empty")
                ? []
                : Array.from({ length: 10 }, (_, i) => ({
                    id: `fixture-${i}`,
                    category: "top",
                    name: `衣物 ${i + 1}`,
                    imageUrl: null,
                    cutoutUrl: null,
                  }))
            }
          />
        ) : query.has("welcome") ? (
          <AuthEntryGateway />
        ) : (
          <OnboardingFlow userId={query.get("user") ?? "fixture-a"} />
        )}
      </main>
    </div>,
  );
