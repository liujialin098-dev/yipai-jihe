"use client";

import { LockKeyhole, Shirt, UserRound } from "lucide-react";
import { useState } from "react";
import { RegistrationForm } from "@/components/auth/account-forms";
import {
  AnonymousExperienceForm,
  LoginForm,
} from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand-mark";
import { BrandName } from "@/components/brand-name";

type EntryMode = "login" | "register";

export function AuthEntryGateway({ feedback }: { feedback?: string | null }) {
  const [mode, setMode] = useState<EntryMode>("login");

  return (
    <div className="auth-entry-page page-enter min-h-dvh px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3">
        <BrandMark className="size-11 shadow-[0_10px_26px_rgba(29,29,31,0.11)]" />
        <div>
          <BrandName className="auth-brand-name" />
          <p className="mt-1.5 text-[0.68rem] font-medium text-[var(--text-tertiary)]">
            你的私人穿搭助手
          </p>
        </div>
      </header>

      <section className="mt-10">
        <p className="app-page-meta">进入衣橱前</p>
        <h1 className="app-page-title mt-2">先选择一种身份</h1>
        <p className="app-page-lead mt-4">
          登录可找回原衣橱，注册后可跨设备使用，也可以先用体验身份看看。
        </p>
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
                  邮箱和密码一次提交，注册成功后直接进入，不发送验证邮件。
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
          ? "bg-[#1d1d1f] text-white shadow-[0_9px_24px_rgba(29,29,31,0.18)]"
          : "text-[var(--text-secondary)]"
      }`}
    >
      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
      {label}
    </button>
  );
}
