"use client";

import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Shirt,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RegistrationForm } from "@/components/auth/account-forms";
import {
  AnonymousExperienceForm,
  LoginForm,
} from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand-mark";
import { BrandMotion } from "@/components/brand-motion";
import { BrandName } from "@/components/brand-name";
import { SupportLinks } from "@/components/support-links";

type EntryMode = "login" | "register";

export function AuthEntryGateway({ feedback }: { feedback?: string | null }) {
  const [mode, setMode] = useState<EntryMode>("login");
  const [showForm, setShowForm] = useState(Boolean(feedback));
  const [showExperience, setShowExperience] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (showForm) titleRef.current?.focus({ preventScroll: true });
  }, [showForm]);
  function enter(nextMode: EntryMode) {
    setMode(nextMode);
    setShowForm(true);
  }

  if (!showForm)
    return (
      <div className="entry-welcome">
        <div className="entry-welcome-art">
          <BrandMotion variant="splash" />
        </div>
        <section className="entry-welcome-copy">
          <p className="entry-eyebrow">YOUR EVERYDAY WARDROBE</p>
          <h1 className="app-page-title">把喜欢，穿成日常。</h1>
          <p>收好每件衣服，记下每一天的自己。</p>
        </section>
        <div className="entry-welcome-actions">
          <button
            type="button"
            className="onboarding-next"
            onClick={() => enter("register")}
          >
            创建我的衣橱
            <ArrowRight size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="entry-login"
            onClick={() => enter("login")}
          >
            已有账号，登录
          </button>
          <button
            type="button"
            className="entry-experience"
            aria-expanded={showExperience}
            aria-controls="welcome-experience"
            onClick={() => setShowExperience(!showExperience)}
          >
            暂时不注册
          </button>
          {showExperience ? (
            <div id="welcome-experience">
              <AnonymousExperienceForm compact />
            </div>
          ) : null}
        </div>
        <SupportLinks />
      </div>
    );

  return (
    <div className="auth-entry-page page-enter min-h-dvh px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <button
          type="button"
          className="onboarding-back"
          aria-label="返回欢迎页"
          onClick={() => setShowForm(false)}
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <BrandMark className="size-11 shadow-[0_10px_26px_rgba(29,29,31,0.11)]" />
        <div>
          <BrandName className="auth-brand-name" />
        </div>
      </header>

      <section className="mt-10">
        <h1 className="app-page-title mt-2" ref={titleRef} tabIndex={-1}>
          {mode === "login" ? "欢迎回来" : "从你的衣橱开始"}
        </h1>
      </section>

      {feedback ? (
        <output className="motion-status mt-5 rounded-[1.15rem] bg-[var(--system-blue-soft)] px-4 py-3 text-sm leading-6 text-[var(--system-blue)]">
          {feedback}
        </output>
      ) : null}

      <section className="surface-card mt-7 rounded-[1.85rem] p-2.5">
        <div
          className="auth-entry-switch grid grid-cols-2 rounded-[1.2rem] bg-[var(--surface-soft)] p-1"
          role="tablist"
          aria-label="账号进入方式"
        >
          <ModeButton
            active={mode === "login"}
            controls="auth-login-panel"
            icon={LockKeyhole}
            id="auth-login-tab"
            label="登录"
            onClick={() => setMode("login")}
          />
          <ModeButton
            active={mode === "register"}
            controls="auth-register-panel"
            icon={UserRound}
            id="auth-register-tab"
            label="注册"
            onClick={() => setMode("register")}
          />
        </div>

        <div className="px-2.5 pb-3">
          {mode === "login" ? (
            <div
              id="auth-login-panel"
              role="tabpanel"
              aria-labelledby="auth-login-tab"
            >
              <LoginForm embedded showExperience={false} />
            </div>
          ) : (
            <div
              id="auth-register-panel"
              role="tabpanel"
              aria-labelledby="auth-register-tab"
            >
              <div className="mt-6 px-1">
                <h2 className="app-card-title">创建可找回的衣橱</h2>
                <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                  用邮箱和密码保存你的衣橱。
                </p>
                <RegistrationForm />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-[1.65rem] border border-[var(--hairline)] bg-[color-mix(in_srgb,var(--surface-solid)_68%,transparent)] p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h2 className="app-card-title">暂时不注册</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              体验身份也有独立数据空间，只在你明确选择后创建。
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
            <Shirt className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4">
          <AnonymousExperienceForm compact />
        </div>
      </section>
      <SupportLinks />
    </div>
  );
}

function ModeButton({
  active,
  controls,
  icon: Icon,
  id,
  label,
  onClick,
}: {
  active: boolean;
  controls: string;
  icon: typeof LockKeyhole;
  id: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="tab"
      aria-controls={controls}
      aria-selected={active}
      onClick={onClick}
      className={`auth-entry-switch-button motion-button flex h-11 items-center justify-center gap-2 rounded-[0.95rem] text-sm font-semibold ${
        active
          ? "bg-[var(--control-primary)] text-[var(--control-primary-foreground)] shadow-[0_9px_24px_rgba(29,29,31,0.18)]"
          : "text-[var(--text-secondary)]"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      {label}
    </button>
  );
}
