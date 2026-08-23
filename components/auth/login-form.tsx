"use client";

import { KeyRound, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestPasswordSetupLink,
  signInWithEmail,
  startAnonymousExperience,
} from "@/lib/auth/actions";
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

export function LoginForm() {
  const [state, action] = useActionState(signInWithEmail, initialAuthState);

  return (
    <>
      <form action={action} className="surface-card mt-7 rounded-[1.7rem] p-5">
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
            className="field-control h-12 pl-11 text-sm"
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
            className="field-control h-12 pl-11 text-sm"
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

      <PasswordSetupLinkForm />

      <div className="my-6 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        <span className="h-px flex-1 bg-[var(--hairline)]" />
        或者
        <span className="h-px flex-1 bg-[var(--hairline)]" />
      </div>

      <form action={startAnonymousExperience}>
        <button
          type="submit"
          className="motion-button h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] text-sm font-semibold text-[var(--foreground)]"
        >
          开始新的匿名体验
        </button>
      </form>
      <p className="mt-3 text-center text-xs leading-5 text-[var(--text-tertiary)]">
        新匿名身份不会显示旧数据；旧衣橱仍可用原邮箱登录恢复。
      </p>
    </>
  );
}

function PasswordSetupLinkForm() {
  const [state, action] = useActionState(
    requestPasswordSetupLink,
    initialAuthState,
  );

  return (
    <details className="surface-card mt-4 rounded-[1.4rem] p-4 open:p-5">
      <summary className="pressable flex cursor-pointer list-none items-center gap-3 text-sm font-semibold">
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--system-blue-soft)] text-[var(--system-blue)]">
          <KeyRound className="size-4" aria-hidden="true" />
        </span>
        已绑定邮箱，但还没有密码？
      </summary>
      <form
        action={action}
        className="mt-4 border-t border-[var(--hairline)] pt-4"
      >
        <label htmlFor="setup-email" className="text-sm font-semibold">
          已绑定邮箱
        </label>
        <div className="relative mt-2">
          <Mail className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            id="setup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className="field-control h-12 pl-11 text-sm"
          />
        </div>
        <p className="mt-1.5 min-h-4 text-xs text-[#b42318]">
          {state.fieldErrors?.email}
        </p>
        <PasswordLinkSubmit />
        {state.status !== "idle" ? (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`motion-status mt-4 rounded-[1rem] px-4 py-3 text-sm leading-6 ${
              state.status === "error"
                ? "bg-[#ff453a]/8 text-[#b42318]"
                : "bg-[#30a46c]/9 text-[#18794e]"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </details>
  );
}

function PasswordLinkSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] text-sm font-semibold text-white disabled:opacity-55"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "正在发送…" : "发送密码设置链接"}
    </button>
  );
}
