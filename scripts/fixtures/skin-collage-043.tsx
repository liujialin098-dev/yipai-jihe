import { createRoot } from "react-dom/client";
import { HomeCollage } from "@/components/home/home-collage";
import { SkinPicker } from "@/components/skin-picker";
import { StatusHeader } from "@/components/status-header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { RoundedIcon } from "@/components/ui/rounded-icon";
const items = Array.from({ length: 10 }, (_, i) => ({
  id: `fixture-${i}`,
  name:
    ["奶油针织", "蓝色衬衫", "棕色夹克", "丁香卫衣", "长裤"][i % 5] + (i + 1),
  category: i % 2 ? "tops" : "bottoms",
  imageUrl: `/image-${i}.png`,
  cutoutUrl: `/image-${i}.png`,
}));
function Fixture() {
  return (
    <div className="app-backdrop mx-auto max-w-[30rem] min-h-dvh pb-28">
      <StatusHeader viewer={null} />
      <main className="px-5 pt-4">
        <h1 className="app-page-title text-center">
          <span className="brand-name-english">Hello,</span> 小林
        </h1>
        <HomeCollage items={items} viewerId="isolated-fixture-043" />
        <a className="home-wardrobe-entry" href="/wardrobe">
          <span className="home-wardrobe-symbol">
            <RoundedIcon name="wardrobe" />
          </span>
          <span>
            <strong>我的衣橱</strong>
            <small>10 件衣物</small>
          </span>
        </a>
        <SkinPicker />
      </main>
      <BottomNavigation />
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Fixture />);
