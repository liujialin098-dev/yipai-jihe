import {
  validateRecognitionResult,
  type WardrobeRecognition,
} from "@/lib/wardrobe/validation";
import { requestOpenAiResponse } from "@/lib/openai/responses";

export const WARDROBE_RECOGNITION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1, maxLength: 60 },
    category: {
      type: "string",
      enum: ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories"],
    },
    audience: {
      type: "string",
      enum: ["male", "female", "unisex"],
    },
    primary_color: {
      type: "string",
      enum: [
        "black",
        "white",
        "gray",
        "navy",
        "blue",
        "green",
        "beige",
        "brown",
        "red",
        "pink",
        "purple",
        "yellow",
      ],
    },
    material: {
      type: "string",
      enum: [
        "cotton",
        "linen",
        "denim",
        "knit",
        "wool",
        "silk",
        "leather",
        "synthetic",
      ],
    },
    style: {
      type: "string",
      enum: ["minimal", "casual", "commute", "elegant", "sporty", "vintage"],
    },
    seasons: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
        enum: ["spring", "summer", "autumn", "winter"],
      },
    },
    occasions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "string",
        enum: ["commute", "casual", "date", "formal", "sport"],
      },
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    note: { type: "string", maxLength: 120 },
  },
  required: [
    "name",
    "category",
    "audience",
    "primary_color",
    "material",
    "style",
    "seasons",
    "occasions",
    "confidence",
    "note",
  ],
} as const;

export type RecognitionFailureCode =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "provider_error"
  | "invalid_result";

export class RecognitionError extends Error {
  constructor(
    public readonly code: RecognitionFailureCode,
    public readonly httpStatus: number,
    public readonly reason?: "quota_exhausted",
  ) {
    super(code);
    this.name = "RecognitionError";
  }
}

type OpenAIResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{ type?: unknown; text?: unknown }>;
  }>;
};

const PROMPT = `识别图片中最主要的一件衣物。只按提供的枚举返回结果。
name 使用简洁中文；无法确定材质时选最接近项并把 confidence 设为 low。
一图多件、真人穿搭或背景复杂时只识别视觉中心的主单品，并在 note 提醒用户核对。
颜色取面积最大的主色；seasons 和 occasions 至少各选一项。
audience 表示衣物版型归属：明确男装选 male，明确女装选 female，无法判断或通用款选 unisex。`;

function outputText(response: OpenAIResponse) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

export async function recognizeWardrobeImage(imageUrl: string): Promise<{
  result: WardrobeRecognition;
  model: string;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new RecognitionError("not_configured", 424);

  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await requestOpenAiResponse({
      apiKey,
      body: JSON.stringify({
        model,
        store: false,
        temperature: 0.1,
        max_output_tokens: 400,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: PROMPT },
              { type: "input_image", image_url: imageUrl, detail: "low" },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "wardrobe_recognition",
            strict: true,
            schema: WARDROBE_RECOGNITION_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let providerError: unknown;
      try {
        providerError = await response.json();
      } catch {
        providerError = null;
      }
      const metadata = providerErrorMetadata(providerError);
      console.error("[wardrobe-recognition] OpenAI request rejected", {
        status: response.status,
        requestId: response.headers.get("x-request-id"),
        ...metadata,
      });
      if (response.status === 429) {
        if (
          metadata.errorType === "insufficient_quota" ||
          metadata.errorCode === "credit_balance_exhausted"
        ) {
          throw new RecognitionError("provider_error", 429, "quota_exhausted");
        }
        throw new RecognitionError("rate_limited", 429);
      }
      throw new RecognitionError("provider_error", 502);
    }

    const payload = (await response.json()) as OpenAIResponse;
    const text = outputText(payload);
    if (!text) throw new RecognitionError("invalid_result", 422);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new RecognitionError("invalid_result", 422);
    }

    const validation = validateRecognitionResult(parsed);
    if (!validation.success) {
      throw new RecognitionError("invalid_result", 422);
    }

    return { result: validation.data, model };
  } catch (error) {
    if (error instanceof RecognitionError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new RecognitionError("timeout", 504);
    }
    console.error("[wardrobe-recognition] OpenAI transport failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    throw new RecognitionError("provider_error", 502);
  } finally {
    clearTimeout(timeout);
  }
}

function providerErrorMetadata(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return {};
  }
  const error = payload.error;
  if (!error || typeof error !== "object") return {};

  return {
    errorType: "type" in error ? String(error.type) : undefined,
    errorCode: "code" in error ? String(error.code) : undefined,
    errorParam: "param" in error ? String(error.param) : undefined,
  };
}
