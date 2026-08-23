"use client";

import { Check, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { requestEmailBinding, setAccountPassword } from "@/lib/auth/actions";
import { initialAuthState } from "@/lib/auth/errors";

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="motion-button mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-sm font-semibold text-white disabled:opacity-55"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
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
          ? "bg-[#ff453a]/8 text-[#b42318]"
          : "bg-[#30a46c]/9 text-[#18794e]"
      }`}
    >
      {state.message}
    </div>
  );
}

export function EmailBindingForm() {
  const [state, action] = useActionState(requestEmailBinding, initialAuthState);

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
          className="field-control h-12 pl-11 text-sm"
        />
      </div>
      <p id="binding-email-error" className="mt-2 text-xs text-[#b42318]">
        {state.fieldErrors?.email}
      </p>
      <SubmitButton>发送验证邮件</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordSetupForm() {
  const router = useRouter();
  const [state, action] = useActionState(setAccountPassword, initialAuthState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [router, state.status]);

  return (
    <form action={action} className="mt-5">
      <PasswordField
        id="new-password"
        name="password"
        label="设置密码"
        error={state.fieldErrors?.password}
        autoComplete="new-password"
      />
      <div className="mt-4">
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="再次输入"
          error={state.fieldErrors?.confirmPassword}
          autoComplete="new-password"
        />
      </div>
      <SubmitButton>保护这间衣橱</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  name,
}: {
  autoComplete: string;
  error?: string;
  id: string;
  label: string;
  name: string;
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
          minLength={8}
          required
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-error`}
          className="field-control h-12 pl-11 text-sm"
        />
      </div>
      <p id={`${id}-error`} className="mt-2 text-xs text-[#b42318]">
        {error}
      </p>
    </div>
  );
}

export function AccountProtectedBadge() {
  return (
    <div className="motion-status mt-5 flex items-start gap-3 rounded-[1.2rem] bg-[#30a46c]/9 px-4 py-3.5 text-[#18794e]">
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
