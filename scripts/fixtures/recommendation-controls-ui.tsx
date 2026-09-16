import { createRoot } from "react-dom/client";
import { PageMotion } from "../../components/page-motion";
import { RecommendationControls } from "../../components/recommendations/recommendation-controls";
import { UploadPhotoHint } from "../../components/wardrobe/upload-photo-hint";

const root = document.getElementById("root");
if (!root) throw new Error("Missing fixture root");
createRoot(root).render(
  <main className="mx-auto max-w-md px-5 py-6">
    <PageMotion>
      <h1 className="app-page-title mb-5">今天穿什么</h1>
      <RecommendationControls
        defaultOccasion="commute"
        hasRecommendation={false}
        targetDay="today"
      />
      <UploadPhotoHint />
      <label id="label-regression" className="mt-5 block p-4">
        <input type="checkbox" name="label-test" /> <span>标签点击回归</span>
      </label>
      <div id="swipe-test" style={{ height: 120 }}>
        空白滑动区域
      </div>
    </PageMotion>
  </main>,
);
