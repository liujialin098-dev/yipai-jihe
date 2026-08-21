import {
  CATEGORY_OPTIONS,
  COLOR_OPTIONS,
  isOptionValue,
  MATERIAL_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  STATUS_OPTIONS,
  STYLE_OPTIONS,
  type Category,
  type Material,
  type Occasion,
  type Season,
  type WardrobeColor,
  type WardrobeStatus,
  type WardrobeStyle,
} from "@/lib/wardrobe/constants";

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export const INITIAL_ACTION_STATE: ActionState = {
  status: "idle",
  message: "",
};

export type WardrobeItemInput = {
  name: string;
  category: Category;
  primary_color: WardrobeColor;
  material: Material;
  style: WardrobeStyle;
  seasons: Season[];
  occasions: Occasion[];
};

export type WardrobeFilters = {
  q: string;
  category?: Category;
  color?: WardrobeColor;
  season?: Season;
  occasion?: Occasion;
  status: WardrobeStatus;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function uniqueStringValues(formData: FormData, key: string) {
  return [
    ...new Set(
      formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string"),
    ),
  ];
}

export function parseWardrobeFilters(
  searchParams: SearchParams,
): WardrobeFilters {
  const q = (firstParam(searchParams.q) ?? "").trim().slice(0, 60);
  const category = firstParam(searchParams.category) ?? "";
  const color = firstParam(searchParams.color) ?? "";
  const season = firstParam(searchParams.season) ?? "";
  const occasion = firstParam(searchParams.occasion) ?? "";
  const status = firstParam(searchParams.status) ?? "active";

  return {
    q,
    category: isOptionValue(CATEGORY_OPTIONS, category) ? category : undefined,
    color: isOptionValue(COLOR_OPTIONS, color) ? color : undefined,
    season: isOptionValue(SEASON_OPTIONS, season) ? season : undefined,
    occasion: isOptionValue(OCCASION_OPTIONS, occasion) ? occasion : undefined,
    status: isOptionValue(STATUS_OPTIONS, status) ? status : "active",
  };
}

export function validateWardrobeItemForm(
  formData: FormData,
):
  | { success: true; data: WardrobeItemInput }
  | { success: false; fieldErrors: Record<string, string[]> } {
  const name = stringValue(formData, "name").trim();
  const category = stringValue(formData, "category");
  const primaryColor = stringValue(formData, "primary_color");
  const material = stringValue(formData, "material");
  const style = stringValue(formData, "style");
  const seasons = uniqueStringValues(formData, "seasons");
  const occasions = uniqueStringValues(formData, "occasions");
  const fieldErrors: Record<string, string[]> = {};

  if (name.length === 0) {
    fieldErrors.name = ["请填写衣物名称"];
  } else if (name.length > 60) {
    fieldErrors.name = ["名称最多 60 个字符"];
  }

  if (!isOptionValue(CATEGORY_OPTIONS, category)) {
    fieldErrors.category = ["请选择有效类别"];
  }
  if (!isOptionValue(COLOR_OPTIONS, primaryColor)) {
    fieldErrors.primary_color = ["请选择有效主色"];
  }
  if (!isOptionValue(MATERIAL_OPTIONS, material)) {
    fieldErrors.material = ["请选择有效材质"];
  }
  if (!isOptionValue(STYLE_OPTIONS, style)) {
    fieldErrors.style = ["请选择有效风格"];
  }
  if (
    seasons.length === 0 ||
    !seasons.every((value) => isOptionValue(SEASON_OPTIONS, value))
  ) {
    fieldErrors.seasons = ["至少选择一个有效季节"];
  }
  if (
    occasions.length === 0 ||
    !occasions.every((value) => isOptionValue(OCCASION_OPTIONS, value))
  ) {
    fieldErrors.occasions = ["至少选择一个有效场合"];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      name,
      category: category as Category,
      primary_color: primaryColor as WardrobeColor,
      material: material as Material,
      style: style as WardrobeStyle,
      seasons: seasons as Season[],
      occasions: occasions as Occasion[],
    },
  };
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}
