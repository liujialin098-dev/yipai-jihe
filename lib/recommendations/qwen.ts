import "server-only";

export type RecommendationFailureCode =
  | "not_configured"
  | "invalid_config"
  | "unauthorized"
  | "timeout"
  | "rate_limited"
  | "provider_error"
  | "output_truncated"
  | "invalid_result";

export class RecommendationGenerationError extends Error {
  readonly code: RecommendationFailureCode;
  readonly status?: number;
  constructor(code: RecommendationFailureCode, status?: number) {
    super(code);
    this.name = "RecommendationGenerationError";
    this.code = code;
    this.status = status;
  }
}

export const QWEN_TIMEOUT_MS = 25_000;
const DEFAULT_MODEL = "qwen3.8-max";
type Environment = Record<string, string | undefined>;

export function qwenConfiguration(env: Environment = process.env) {
  const apiKey = env.DASHSCOPE_API_KEY?.trim();
  const host = env.DASHSCOPE_API_HOST?.trim().toLowerCase();
  const model = env.QWEN_RECOMMENDATION_MODEL?.trim() || DEFAULT_MODEL;
  if (
    !apiKey ||
    !host ||
    apiKey === "[SENSITIVE]" ||
    apiKey === "your_dashscope_api_key"
  ) {
    throw new RecommendationGenerationError("not_configured");
  }
  // 密钥只能送往北京百炼工作空间，不接受任意代理、路径或重定向。
  if (
    !/^[a-z0-9][a-z0-9-]{0,62}\.cn-beijing\.maas\.aliyuncs\.com$/.test(host) ||
    !/^qwen[a-z0-9.-]{1,70}$/.test(model)
  ) {
    throw new RecommendationGenerationError("invalid_config");
  }
  return {
    apiKey,
    model,
    endpoint: `https://${host}/compatible-mode/v1/chat/completions`,
  };
}

export async function requestQwenRecommendations(
  prompt: string,
  schema: object,
  options: {
    env?: Environment;
    fetcher?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<{ parsed: unknown; model: string }> {
  const { apiKey, model, endpoint } = qwenConfiguration(options.env);
  const controller = new AbortController();
  const timeoutMs = Math.min(
    options.timeoutMs ?? QWEN_TIMEOUT_MS,
    QWEN_TIMEOUT_MS,
  );
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new RecommendationGenerationError("timeout"));
    }, timeoutMs);
  });
  const request = async () => {
    const response = await (options.fetcher ?? fetch)(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        enable_thinking: false,
        max_tokens: 4096,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "daily_wardrobe_recommendations",
            strict: true,
            schema,
          },
        },
      }),
    });
    if (!response.ok) {
      const code =
        response.status === 401 || response.status === 403
          ? "unauthorized"
          : response.status === 429
            ? "rate_limited"
            : "provider_error";
      await response.body?.cancel();
      throw new RecommendationGenerationError(code, response.status);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new RecommendationGenerationError("invalid_result");
    }
    const candidate = payload as {
      choices?: {
        finish_reason?: string;
        message?: { content?: unknown; refusal?: unknown };
      }[];
    } | null;
    const choice = Array.isArray(candidate?.choices)
      ? candidate.choices[0]
      : null;
    if (choice?.finish_reason === "length")
      throw new RecommendationGenerationError("output_truncated");
    if (
      choice?.finish_reason !== "stop" ||
      choice.message?.refusal ||
      typeof choice.message?.content !== "string"
    ) {
      throw new RecommendationGenerationError("invalid_result");
    }
    try {
      return { parsed: JSON.parse(choice.message.content) as unknown, model };
    } catch {
      throw new RecommendationGenerationError("invalid_result");
    }
  };
  try {
    // 包含响应体解析的整体截止时间，不自动重试；即使传输未及时响应 abort 也能降级。
    return await Promise.race([request(), timeout]);
  } catch (error) {
    if (controller.signal.aborted)
      throw new RecommendationGenerationError("timeout");
    if (error instanceof RecommendationGenerationError) throw error;
    throw new RecommendationGenerationError("provider_error");
  } finally {
    clearTimeout(timeoutId);
  }
}

export function recommendationFailureMessage(code: RecommendationFailureCode) {
  const messages: Record<RecommendationFailureCode, string> = {
    not_configured: "千问搭配尚未配置",
    invalid_config: "千问搭配配置需检查",
    unauthorized: "千问服务鉴权未通过",
    timeout: "千问响应超时",
    rate_limited: "千问请求受限",
    provider_error: "千问服务暂时无法连接",
    output_truncated: "千问未返回完整搭配",
    invalid_result: "千问结果未通过搭配检查",
  };
  return messages[code];
}
