"use client";

import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInWithEmail, startAnonymousExperience } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/errors";

function LoginSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-sm font-semibold text-white disabled:opacity-55"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "正在打开衣橱…" : "登录并恢复衣橱"}
    </button>
  );
}

export function LoginForm({
  embedded = false,
  showExperience = true,
}: {
  embedded?: boolean;
  showExperience?: boolean;
}) {
  const [state, action] = useActionState(signInWithEmail, initialAuthState);

  return (
    <>
      <form
        action={action}
        className={
          embedded ? "mt-6 px-1" : "surface-card mt-7 rounded-[1.7rem] p-5"
        }
      >
        <label htmlFor="login-email" className="text-sm font-semibold">
          邮箱
        </label>
        <div className="relative mt-2">
          <Mail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className="field-control field-control-with-icon h-12 text-sm"
          />
        </div>
        <p className="mt-1.5 min-h-4 text-xs text-[#b42318]">
          {state.fieldErrors?.email}
        </p>

        <label
          htmlFor="login-password"
          className="mt-3 block text-sm font-semibold"
        >
          密码
        </label>
        <div className="relative mt-2">
          <LockKeyhole className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className="field-control field-control-with-icon h-12 text-sm"
          />
        </div>
        <p className="mt-1.5 min-h-4 text-xs text-[#b42318]">
          {state.fieldErrors?.password}
        </p>
        <LoginSubmit />
        {state.status === "error" ? (
          <p
            role="alert"
            className="motion-status mt-4 rounded-[1rem] bg-[#ff453a]/8 px-4 py-3 text-sm text-[#b42318]"
          >
            {state.message}
          </p>
        ) : null}
      </form>

      {showExperience ? <AnonymousExperienceForm /> : null}
    </>
  );
}

function ExperienceSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-sm font-semibold text-[var(--foreground)] disabled:opacity-55"
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowRight className="size-4" aria-hidden="true" />
      )}
      {pending ? "正在建立体验身份…" : "使用体验身份进入"}
    </button>
  );
}

export function AnonymousExperienceForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mt-6"}>
      {compact ? null : (
        <div className="mb-6 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
          <span className="h-px flex-1 bg-[var(--hairline)]" />
          或者
          <span className="h-px flex-1 bg-[var(--hairline)]" />
        </div>
      )}
      <form action={startAnonymousExperience}>
        <ExperienceSubmit />
      </form>
      <p className="mt-3 text-center text-xs leading-5 text-[var(--text-tertiary)]">
        适合先试用；清除站点数据或换设备后无法找回体验衣橱。
      </p>
    </div>
  );
}
