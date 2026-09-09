"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SKIN_STORAGE_KEY,
  type SkinId,
  skins,
  validSkin,
} from "@/lib/ui/skins";

export function SkinPicker() {
  const [current, setCurrent] = useState<SkinId>("original");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setCurrent(validSkin(root.dataset.skin));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-skin"],
    });
    return () => observer.disconnect();
  }, []);
  function choose(id: SkinId) {
    document.documentElement.dataset.skin = id;
    setCurrent(id);
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, id);
      setMessage("已保存到本设备");
    } catch {
      setMessage("已切换；浏览器无法保存，刷新后可能恢复原色。");
    }
  }
  return (
    <section
      className="surface-card skin-picker"
      id="appearance"
      aria-labelledby="skin-title"
    >
      <div className="skin-heading">
        <h2 className="app-section-title" id="skin-title">
          外观皮肤
        </h2>
        <Palette size={20} aria-hidden="true" />
      </div>
      <div className="skin-options">
        {skins.map((skin) => (
          <button
            type="button"
            key={skin.id}
            className="skin-option"
            aria-pressed={current === skin.id}
            onClick={() => choose(skin.id)}
          >
            <span
              className="skin-preview"
              aria-hidden="true"
              style={{ background: skin.colors[2] }}
            >
              <span
                className="skin-preview-header"
                style={{ background: skin.colors[1] }}
              />
              <span
                className="skin-preview-card"
                style={{ background: skin.colors[0] }}
              />
              <span
                className="skin-preview-dot"
                style={{ background: skin.colors[1] }}
              />
            </span>
            <span className="skin-option-label">
              {skin.name}
              {current === skin.id ? (
                <Check size={16} aria-hidden="true" />
              ) : null}
            </span>
          </button>
        ))}
      </div>
      <output className="skin-status">{message}</output>
    </section>
  );
}
