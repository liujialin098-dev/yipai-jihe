import {
  OCCASION_OPTIONS,
  isOptionValue,
  type Occasion,
} from "@/lib/wardrobe/constants";
import { isUuid } from "@/lib/wardrobe/validation";

export const DIARY_RANGES = ["30", "90", "all"] as const;
export type DiaryRange = (typeof DIARY_RANGES)[number];

export type DiaryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const INITIAL_DIARY_ACTION_STATE: DiaryActionState = {
  status: "idle",
  message: "",
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function dateInTimeZone(date = new Date(), timeZone = "Asia/Shanghai") {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function isIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function isDiaryMonth(value: string) {
  if (!MONTH_PATTERN.test(value)) return false;
  return isIsoDate(`${value}-01`);
}

export function resolveDiaryMonth(value: unknown, today: string) {
  const currentMonth = today.slice(0, 7);
  return typeof value === "string" &&
    isDiaryMonth(value) &&
    value <= currentMonth
    ? value
    : currentMonth;
}

export function monthBounds(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
  const end = new Date(nextMonth.valueOf() - 86_400_000)
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

export function shiftMonth(month: string, amount: -1 | 1) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
    .toISOString()
    .slice(0, 7);
}

export function parseDiaryRange(value: unknown): DiaryRange {
  return typeof value === "string" && DIARY_RANGES.includes(value as DiaryRange)
    ? (value as DiaryRange)
    : "30";
}

export function diaryRangeStart(range: DiaryRange, today: string) {
  if (range === "all") return null;
  const start = new Date(`${today}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - (Number(range) - 1));
  return start.toISOString().slice(0, 10);
}

export function parseDiaryOccasion(value: string): Occasion | null {
  return isOptionValue(OCCASION_OPTIONS, value) ? value : null;
}

export function parseDiaryItemIds(values: FormDataEntryValue[]) {
  const ids = values.map((value) => String(value));
  if (
    ids.length < 1 ||
    ids.length > 8 ||
    ids.some((id) => !isUuid(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return null;
  }
  return ids;
}

export function parseDiaryText(value: unknown, maxLength: number) {
  const text = String(value ?? "").trim();
  return text.length <= maxLength ? text : null;
}
