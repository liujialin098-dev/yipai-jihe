"use client";

import { Image, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ensemble:upload-photo-hint:v1";

export function UploadPhotoHint() {
  const [visible, setVisible] = useState<boolean | null>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, []);
  useEffect(() => {
    if (moved.current)
      (visible ? dismiss : restore).current?.focus({ preventScroll: true });
  }, [visible]);

  function change(show: boolean) {
    moved.current = true;
    setVisible(show);
    try {
      if (show) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* Storage may be unavailable; dismissal still works for this visit. */
    }
  }
  if (visible === null) return null;
  if (!visible)
    return (
      <button
        ref={restore}
        type="button"
        className="upload-hint-restore"
        onClick={() => change(true)}
      >
        <Image size={16} aria-hidden="true" />
        拍摄建议
      </button>
    );
  return (
    <aside className="upload-photo-hint" aria-label="拍摄建议">
      <Image size={22} aria-hidden="true" />
      <p>尽量选择背景干净、衣物完整清晰的图片，识别和贴纸效果会更好。</p>
      <button
        ref={dismiss}
        type="button"
        onClick={() => change(false)}
        aria-label="关闭拍摄建议，不再提示"
        title="关闭后在此设备不再提示"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
