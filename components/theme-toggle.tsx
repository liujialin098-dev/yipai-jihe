"use client";

import { useEffect, useState } from "react";
import { RoundedIcon } from "@/components/ui/rounded-icon";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light", !next);
    setDark(next);
    try {
      localStorage.setItem("ensemble-theme-v1", next ? "dark" : "light");
    } catch {
      /* Storage is optional. */
    }
  }
  return (
    <button
      type="button"
      className="header-icon theme-toggle"
      onClick={toggle}
      aria-label="夜间模式"
      aria-pressed={dark}
      title={dark ? "切换为日间模式" : "切换为夜间模式"}
    >
      <RoundedIcon name="moon" className="theme-moon" />
      <RoundedIcon name="sun" className="theme-sun" />
    </button>
  );
}
