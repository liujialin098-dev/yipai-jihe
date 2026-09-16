"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { RecoveryState } from "@/lib/auth/password-recovery";
import { recoverAccount } from "@/lib/auth/recovery-actions";

const initial: RecoveryState = { status: "idle", message: "" };
const labels = {
  email: "邮箱",
  token: "验证码",
  password: "新密码",
  confirmPassword: "确认新密码",
};

export function RecoveryForm() {
  const [state, action, pending] = useActionState(recoverAccount, initial);
  const [email, setEmail] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const summary = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const complete = state.status === "success" && state.phase === "reset";

  useEffect(() => {
    if (state.status === "idle") return;
    form.current?.reset();
    summary.current?.focus();
  }, [state]);

  useEffect(() => {
    if (state.status !== "success" || state.phase !== "code") return;
    setResendAt(Date.now() + 60_000);
  }, [state]);

  useEffect(() => {
    if (!resendAt) return;
    setSeconds(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAt]);

  return (
    <div className="surface-card mt-6 rounded-[2rem] p-5">
      {state.status !== "idle" ? (
        <div
          ref={summary}
          tabIndex={-1}
          role={state.status === "error" ? "alert" : "status"}
          className={`mb-5 rounded-2xl p-4 text-sm leading-6 outline-offset-4 ${state.status === "error" ? "bg-[var(--danger-surface)] text-[var(--danger-text)]" : "bg-[var(--surface-soft)] text-[var(--foreground)]"}`}
        >
          <p>{state.message}</p>
          {state.needsNewCode ? (
            <p className="mt-2">原验证码可能已使用，请重新获取。</p>
          ) : null}
          {Object.entries(state.fieldErrors ?? {}).length ? (
            <ul className="mt-2 space-y-2">
              {Object.entries(state.fieldErrors ?? {}).map(
                ([name, message]) => (
                  <li key={name}>
                    <a
                      className="underline underline-offset-4"
                      href={`#recovery-${name}`}
                    >
                      {message}
                    </a>
                  </li>
                ),
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
      {complete ? (
        <Link
          className="motion-button flex min-h-12 items-center justify-center rounded-full bg-[var(--control-primary)] px-5 py-3 font-semibold text-[var(--control-primary-foreground)]"
          href="/login?recovery=complete"
        >
          返回登录
        </Link>
      ) : (
        <form ref={form} action={action} aria-busy={pending}>
          <fieldset disabled={pending} className="min-w-0">
            <legend className="app-section-title mb-4">1. 获取验证码</legend>
            <label
              htmlFor="recovery-email"
              className="block text-sm font-semibold"
            >
              邮箱
            </label>
            <input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={
                state.fieldErrors?.email ? "recovery-email-error" : undefined
              }
              className="field-control mt-2 min-h-12 text-base"
            />
            {state.fieldErrors?.email ? (
              <p
                id="recovery-email-error"
                className="mt-2 text-sm text-[var(--danger-text)]"
              >
                {state.fieldErrors.email}
              </p>
            ) : null}
            <button
              name="operation"
              value="send"
              type="submit"
              formNoValidate
              disabled={pending || seconds > 0}
              className="motion-button mt-4 min-h-12 w-full rounded-full border border-[var(--hairline)] bg-[var(--surface-solid)] px-4 py-3 text-sm font-semibold disabled:opacity-55"
            >
              {pending
                ? "正在处理…"
                : seconds > 0
                  ? `${seconds} 秒后可重发`
                  : "获取数字验证码"}
            </button>
          </fieldset>
          <fieldset
            disabled={pending}
            className="mt-7 min-w-0 border-t border-[var(--hairline)] pt-5"
          >
            <legend className="app-section-title pt-5">2. 重设密码</legend>
            <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">
              在这里输入验证码，无需点击邮件链接。新密码至少 8 位。
            </p>
            {(["token", "password", "confirmPassword"] as const).map((name) => (
              <div key={name} className="mt-4">
                <label
                  htmlFor={`recovery-${name}`}
                  className="block text-sm font-semibold"
                >
                  {labels[name]}
                </label>
                <input
                  id={`recovery-${name}`}
                  name={name}
                  required
                  type={name === "token" ? "text" : "password"}
                  inputMode={name === "token" ? "numeric" : undefined}
                  autoComplete={
                    name === "token" ? "one-time-code" : "new-password"
                  }
                  minLength={name === "token" ? 6 : 8}
                  maxLength={name === "token" ? 10 : 72}
                  pattern={name === "token" ? "[0-9]{6,10}" : undefined}
                  aria-invalid={Boolean(state.fieldErrors?.[name])}
                  aria-describedby={
                    state.fieldErrors?.[name]
                      ? `recovery-${name}-error`
                      : undefined
                  }
                  className="field-control mt-2 min-h-12 text-base"
                />
                {state.fieldErrors?.[name] ? (
                  <p
                    id={`recovery-${name}-error`}
                    className="mt-2 text-sm text-[var(--danger-text)]"
                  >
                    {state.fieldErrors[name]}
                  </p>
                ) : null}
              </div>
            ))}
            <button
              name="operation"
              value="reset"
              type="submit"
              disabled={pending}
              className="motion-button mt-6 min-h-12 w-full rounded-full bg-[var(--control-primary)] px-4 py-3 text-sm font-semibold text-[var(--control-primary-foreground)] disabled:opacity-55"
            >
              {pending ? "正在处理…" : "验证并重设密码"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}
