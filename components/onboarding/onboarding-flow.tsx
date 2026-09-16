"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Palette,
  Shirt,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { BrandName } from "@/components/brand-name";
import {
  EMPTY_CHOICES,
  type OnboardingChoices,
  parseOnboardingChoices,
} from "@/lib/onboarding/model";
import { SKIN_STORAGE_KEY, skins, validSkin } from "@/lib/ui/skins";
import { OCCASION_OPTIONS, STYLE_OPTIONS } from "@/lib/wardrobe/constants";

const steps = [
  {
    title: "先认识一下你",
    label: "性别",
    note: "用于初始化衣着偏好，之后随时能改。",
    icon: UserRound,
  },
  {
    title: "选一份喜欢的颜色",
    label: "主题",
    note: "只改变本设备的外观。",
    icon: Palette,
  },
  {
    title: "平时，更多在什么场合",
    label: "场景",
    note: "选 1—3 个常用场景。",
    icon: Sun,
  },
  {
    title: "什么风格最像你",
    label: "风格",
    note: "选 1—3 种，也可以慢慢发现。",
    icon: Sparkles,
  },
];
const fields = ["clothing", "skin", "occasions", "styles"] as const;
const genderOptions = [
  { value: "male", label: "男生", detail: "偏好男装" },
  { value: "female", label: "女生", detail: "偏好女装" },
  { value: "unrestricted", label: "不限定", detail: "喜欢就穿" },
] as const;

export function OnboardingFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const storageKey = `ensemble-onboarding-v1:${userId}`;
  const [choices, setChoices] = useState<OnboardingChoices>(EMPTY_CHOICES);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [direction, setDirection] = useState("forward");
  const locked = useRef(false);
  const initialSkin = useRef(validSkin(null));
  const heading = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    initialSkin.current = validSkin(root.dataset.skin);
    try {
      const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      const parsed = parseOnboardingChoices(stored?.choices);
      if (
        parsed &&
        Number.isInteger(stored.step) &&
        stored.step >= 0 &&
        stored.step < 4
      ) {
        setChoices(parsed);
        setStep(stored.step);
        if (parsed.skin) root.dataset.skin = parsed.skin;
      }
    } catch {
      /* Storage is optional; never block entry. */
    }
    setReady(true);
    return () => {
      if (!completed.current) root.dataset.skin = initialSkin.current;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || completed.current) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ step, choices }));
    } catch {
      /* Optional draft. */
    }
  }, [choices, ready, step, storageKey]);
  useEffect(() => {
    if (ready && heading.current?.textContent === steps[step].title)
      heading.current.focus();
  }, [step, ready]);
  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message]);

  const current = steps[step];
  const Icon = current.icon;
  const selection = choices[fields[step]];
  const hasSelection = Array.isArray(selection)
    ? selection.length > 0
    : selection !== null;
  function toggle(field: "occasions" | "styles", value: string) {
    setMessage("");
    const values = choices[field] as string[];
    if (!values.includes(value) && values.length >= 3) {
      setMessage("最多选择三项，可以先取消一项。");
      return;
    }
    setChoices({
      ...choices,
      [field]: values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    });
  }
  async function next(skip: boolean) {
    if (locked.current || completed.current || !ready) return;
    const field = fields[step];
    const nextChoices = skip
      ? { ...choices, [field]: step < 2 ? null : [] }
      : choices;
    if (skip && field === "skin")
      document.documentElement.dataset.skin = initialSkin.current;
    setChoices(nextChoices);
    setMessage("");
    if (step < 3) {
      setDirection("forward");
      setStep(step + 1);
      return;
    }
    locked.current = true;
    setPending(true);
    try {
      const result = await completeOnboarding(nextChoices);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      completed.current = true;
      if (nextChoices.skin) {
        document.documentElement.dataset.skin = nextChoices.skin;
        try {
          localStorage.setItem(SKIN_STORAGE_KEY, nextChoices.skin);
        } catch {
          /* Current visit still uses the chosen skin. */
        }
      }
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* Optional draft. */
      }
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("连接暂时不可用，选择已保留，请重试。");
    } finally {
      if (!completed.current) {
        locked.current = false;
        setPending(false);
      }
    }
  }
  return (
    <div className="onboarding-page">
      <header className="onboarding-top">
        <BrandName className="onboarding-brand" />
        <Link href="/support" className="onboarding-help">
          帮助
        </Link>
      </header>
      <ol className="onboarding-progress" aria-label="首次使用设置">
        {steps.map((item, index) => (
          <li
            key={item.label}
            aria-current={step === index ? "step" : undefined}
            data-done={index < step}
          >
            <span>
              {index < step ? (
                <Check size={14} aria-hidden="true" />
              ) : (
                index + 1
              )}
            </span>
            {item.label}
          </li>
        ))}
      </ol>
      <section className="onboarding-card surface-card" aria-busy={pending}>
        <div className="onboarding-step" key={step} data-direction={direction}>
          <span className="onboarding-emblem">
            <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <p className="onboarding-counter">0{step + 1} / 04</p>
          <h1 className="app-page-title" ref={heading} tabIndex={-1}>
            {current.title}
          </h1>
          <p className="onboarding-note" id="onboarding-note">
            {current.note}
          </p>
          <fieldset
            disabled={pending || !ready}
            className="onboarding-options"
            aria-describedby="onboarding-note"
          >
            <legend className="sr-only">{current.label}</legend>
            {step === 0
              ? genderOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="onboarding-choice onboarding-gender"
                    aria-pressed={choices.clothing === option.value}
                    onClick={() =>
                      setChoices({ ...choices, clothing: option.value })
                    }
                  >
                    <Shirt size={24} aria-hidden="true" />
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                    {choices.clothing === option.value ? (
                      <Check size={18} aria-hidden="true" />
                    ) : null}
                  </button>
                ))
              : step === 1
                ? skins.map((skin) => (
                    <button
                      key={skin.id}
                      type="button"
                      className="onboarding-choice onboarding-skin"
                      aria-pressed={choices.skin === skin.id}
                      onClick={() => {
                        setChoices({ ...choices, skin: skin.id });
                        document.documentElement.dataset.skin = skin.id;
                      }}
                    >
                      <span
                        className="onboarding-swatch"
                        aria-hidden="true"
                        style={{ background: skin.colors[0] }}
                      >
                        <span style={{ background: skin.colors[1] }} />
                      </span>
                      <span>{skin.name}</span>
                      {choices.skin === skin.id ? (
                        <Check size={16} aria-hidden="true" />
                      ) : null}
                    </button>
                  ))
                : (step === 2 ? OCCASION_OPTIONS : STYLE_OPTIONS).map(
                    (option) => {
                      const selectedValues: readonly string[] =
                        step === 2 ? choices.occasions : choices.styles;
                      const selected = selectedValues.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className="onboarding-choice"
                          aria-pressed={selected}
                          onClick={() =>
                            toggle(
                              step === 2 ? "occasions" : "styles",
                              option.value,
                            )
                          }
                        >
                          <span>{option.label}</span>
                          <span className="onboarding-check" aria-hidden="true">
                            {selected ? <Check size={15} /> : null}
                          </span>
                        </button>
                      );
                    },
                  )}
          </fieldset>
        </div>
        {message ? (
          <p
            className="onboarding-error"
            role="alert"
            tabIndex={-1}
            ref={errorRef}
          >
            {message}
          </p>
        ) : null}
        <div className="onboarding-controls">
          {step > 0 ? (
            <button
              type="button"
              className="onboarding-back"
              disabled={pending || !ready}
              onClick={() => {
                setMessage("");
                setDirection("back");
                setStep(step - 1);
              }}
              aria-label="上一步"
            >
              <ArrowLeft size={20} />
            </button>
          ) : null}
          <button
            type="button"
            className="onboarding-next"
            disabled={pending || !ready || !hasSelection}
            onClick={() => void next(false)}
          >
            {pending ? "正在保存…" : step === 3 ? "进入我的衣橱" : "下一步"}
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className="onboarding-skip"
          disabled={pending || !ready}
          onClick={() => void next(true)}
        >
          {step === 3 ? "跳过，进入 APP" : "跳过这一步"}
        </button>
      </section>
      <p className="onboarding-footer">你的衣橱，由你决定。</p>
    </div>
  );
}
