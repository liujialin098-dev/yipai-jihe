import { createRoot } from "react-dom/client";
import { BottomNavigation } from "../../components/bottom-navigation";
import { InspirationPreferences } from "../../components/inspiration/inspiration-preferences";
import { PageHeading } from "../../components/page-heading";
import { SkinPicker } from "../../components/skin-picker";
import { StatusHeader } from "../../components/status-header";
import { FASHION_TOPICS } from "../../lib/inspiration/validation";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
const saved = localStorage.getItem("fixture-051");
createRoot(root).render(
  <>
    <StatusHeader viewer={null} />
    <main className="mx-auto max-w-md px-5 pt-4" style={{ paddingBottom: 850 }}>
      <section className="inspiration-cover p-5">
        <PageHeading title="时尚灵感">
          <div className="flex flex-wrap justify-center gap-2 text-xs font-medium">
            <span className="inspiration-chip rounded-full px-3 py-1.5">
              12条未读
            </span>
            <span className="inspiration-chip rounded-full px-3 py-1.5">
              Vogue · GQ · Hypebeast
            </span>
          </div>
        </PageHeading>
      </section>
      <InspirationPreferences
        preferences={
          saved
            ? JSON.parse(saved)
            : {
                topics: [...FASHION_TOPICS],
                personalized: true,
                unreadEnabled: true,
              }
        }
      />
      <SkinPicker />
      <section
        id="paper-test"
        className="surface-card mt-5 p-5"
        style={{ height: 500 }}
      >
        <h2 className="app-section-title">单品灵感 · 交互测试卡片</h2>
        <button type="button" className="collage-edit-trigger">
          编辑拼图
        </button>
        <button
          type="button"
          className="detail-cool-button interaction-preserve motion-button h-11 rounded-full px-3.5"
        >
          标记已读
        </button>
      </section>
      <div style={{ height: 500 }} />
    </main>
    <BottomNavigation />
  </>,
);
