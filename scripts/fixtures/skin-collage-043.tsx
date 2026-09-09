import { createRoot } from "react-dom/client";
import { HomeCollage } from "@/components/home/home-collage";
import { SkinPicker } from "@/components/skin-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shirt,
  House,
  Plus,
  Sparkles,
  Sticker,
  Newspaper,
  Heart,
} from "lucide-react";
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
    <div className="app-backdrop mx-auto max-w-[30rem] min-h-dvh px-5 pb-28">
      <header className="editorial-header-shell flex items-center justify-between p-3 mb-6">
        <Shirt size={21} />
        <span className="brand-name-english">Ensemble</span>
        <ThemeToggle />
      </header>
      <h1 className="app-page-title text-center">
        <span className="brand-name-english">Hello,</span> 小林
      </h1>
      <HomeCollage items={items} viewerId="isolated-fixture-043" />
      <a className="home-wardrobe-entry" href="/wardrobe">
        <span className="home-wardrobe-symbol">
          <Shirt />
        </span>
        <span>
          <strong>我的衣橱</strong>
          <small>10 件衣物</small>
        </span>
      </a>
      <SkinPicker />
      <div className="bottom-navigation-shell icon-dock flex justify-around sticky bottom-3 mt-6 p-2">
        {[House, Sparkles, Plus, Sticker, Newspaper].map((Icon, i) => (
          <button
            key={["home", "recommend", "add", "stickers", "news"][i]}
            type="button"
            className="nav-item"
            aria-label={["首页", "推荐", "添加", "贴纸", "资讯"][i]}
          >
            <span className={i === 2 ? "dock-add" : "dock-icon"}>
              <Icon size={23} />
            </span>
          </button>
        ))}
      </div>
      <Heart className="hidden" />
    </div>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<Fixture />);
