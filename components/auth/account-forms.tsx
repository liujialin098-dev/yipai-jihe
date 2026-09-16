"use client";

import { Check, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { registerCurrentAccount, setAccountPassword } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/errors";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-5 text-sm font-semibold text-[var(--control-primary-foreground)] disabled:opacity-55"
    >
      {pending ? (
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : null}
      {pending ? "正在处理…" : children}
    </button>
  );
}

function FormMessage({ state }: { state: typeof initialAuthState }) {
  if (state.status === "idle") return null;
  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      className={`motion-status mt-4 rounded-[1.1rem] px-4 py-3 text-sm leading-6 ${
        state.status === "error"
          ? "bg-[var(--danger-surface)] text-[var(--danger-text)]"
          : "bg-[var(--success-surface)] text-[var(--success-text)]"
      }`}
    >
      {state.message}
    </div>
  );
}

export function RegistrationForm({
  submitLabel = "注册并进入衣橱",
}: {
  submitLabel?: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(
    registerCurrentAccount,
    initialAuthState,
  );

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return (
    <form action={action} className="mt-5">
      <label htmlFor="binding-email" className="text-sm font-semibold">
        常用邮箱
      </label>
      <div className="relative mt-2">
        <Mail
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
        <input
          id="binding-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby="binding-email-error"
          placeholder="name@example.com"
          className="field-control field-control-with-icon h-12 text-sm"
        />
      </div>
      <p
        id="binding-email-error"
        className="mt-2 text-xs text-[var(--danger-text)]"
      >
        {state.fieldErrors?.email}
      </p>
      <div className="mt-4">
        <PasswordField
          id="register-password"
          name="password"
          label="设置登录密码"
          error={state.fieldErrors?.password}
          autoComplete="new-password"
        />
      </div>
      <div className="mt-4">
        <PasswordField
          id="register-confirm-password"
          name="confirmPassword"
          label="再次输入"
          error={state.fieldErrors?.confirmPassword}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function EmailBindingForm() {
  return <RegistrationForm submitLabel="注册并保护衣橱" />;
}

export function PasswordChangeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [state, action, pending] = useActionState(
    setAccountPassword,
    initialAuthState,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
    if (state.status !== "idle") messageRef.current?.focus();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-5" aria-busy={pending}>
      {state.status !== "idle" ? (
        <div
          ref={messageRef}
          tabIndex={-1}
          role={state.status === "error" ? "alert" : "status"}
          className={`motion-status mb-5 rounded-[1.1rem] px-4 py-3 text-sm leading-6 ${state.status === "error" ? "bg-[var(--danger-surface)] text-[var(--danger-text)]" : "bg-[var(--success-surface)] text-[var(--success-text)]"}`}
        >
          <p>{state.message}</p>
          {state.fieldErrors ? (
            <ul className="mt-2 list-disc pl-5">
              {(
                [
                  ["currentPassword", "change-current-password"],
                  ["password", "change-password"],
                  ["confirmPassword", "change-confirm-password"],
                ] as const
              ).map(([field, id]) =>
                state.fieldErrors?.[field] ? (
                  <li key={field}>
                    <a href={`#${id}`} className="underline underline-offset-2">
                      {state.fieldErrors[field]}
                    </a>
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
      <fieldset disabled={pending} className="min-w-0 space-y-4 border-0 p-0">
        <legend className="sr-only">验证原密码并设置新密码</legend>
        <PasswordField
          id="change-current-password"
          name="currentPassword"
          label="原密码"
          error={state.fieldErrors?.currentPassword}
          autoComplete="current-password"
          minLength={1}
          maxLength={1024}
        />
        <PasswordField
          id="change-password"
          name="password"
          label="新密码"
          error={state.fieldErrors?.password}
          autoComplete="new-password"
          maxLength={72}
        />
        <PasswordField
          id="change-confirm-password"
          name="confirmPassword"
          label="确认新密码"
          error={state.fieldErrors?.confirmPassword}
          autoComplete="new-password"
          maxLength={72}
        />
        <p className="text-xs leading-5 text-[var(--text-secondary)]">
          新密码至少 8 位。此操作验证原密码，不需要打开邮箱链接。
        </p>
        <SubmitButton>保存新密码</SubmitButton>
      </fieldset>
    </form>
  );
}

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  name,
  minLength = 8,
  maxLength,
}: {
  autoComplete: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-2">
        <LockKeyhole
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          aria-hidden="true"
        />
        <input
          id={id}
          name={name}
          type="password"
          minLength={minLength}
          maxLength={maxLength}
          required
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-error`}
          className="field-control field-control-with-icon h-12 text-sm"
        />
      </div>
      <p id={`${id}-error`} className="mt-2 text-xs text-[var(--danger-text)]">
        {error}
      </p>
    </div>
  );
}

export function AccountProtectedBadge() {
  return (
    <div className="motion-status mt-5 flex items-start gap-3 rounded-[1.2rem] bg-[var(--success-surface)] px-4 py-3.5 text-[var(--success-text)]">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#30a46c] text-white">
        <Check className="size-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold">账号已保护</p>
        <p className="mt-1 text-xs leading-5 opacity-80">
          可以放心退出，并在其他设备登录恢复这间衣橱。
        </p>
      </div>
    </div>
  );
}
