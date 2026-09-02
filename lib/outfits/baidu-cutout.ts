import sharp from "sharp";

const BAIDU_TOKEN_ENDPOINT = "https://aip.baidubce.com/oauth/2.0/token";
const BAIDU_CUTOUT_ENDPOINT =
  "https://aip.baidubce.com/rest/2.0/image-process/v1/segment";
const INPUT_LIMIT_BYTES = 10 * 1024 * 1024;
const BASE64_INPUT_LIMIT_BYTES = 10 * 1024 * 1024;
const OUTPUT_LIMIT_BYTES = 20 * 1024 * 1024;
const RESPONSE_LIMIT_CHARS = 28 * 1024 * 1024;
const TIMEOUT_MS = 20_000;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const;

export type BaiduCutoutCredentials = {
  apiKey: string;
  secretKey: string;
};

type BaiduTokenCache = BaiduCutoutCredentials & {
  accessToken: string;
  expiresAt: number;
};

type BaiduTokenRequest = BaiduCutoutCredentials & {
  promise: Promise<string>;
};

let tokenCache: BaiduTokenCache | null = null;
let tokenRequest: BaiduTokenRequest | null = null;

export async function requestBaiduCutout(
  source: Blob,
  credentials = credentialsFromEnvironment(),
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  if (!credentials?.apiKey || !credentials.secretKey) {
    throw new Error("cutout_unavailable");
  }
  if (
    source.size < 1 ||
    source.size > INPUT_LIMIT_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(source.type)
  ) {
    throw new Error("image_invalid");
  }

  const image = await prepareBaiduInput(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const accessToken = await getBaiduAccessToken(
        credentials,
        fetcher,
        controller.signal,
        now,
      );
      const payload = await sendCutoutRequest(
        image,
        accessToken,
        fetcher,
        controller.signal,
      );
      if (isExpiredTokenResponse(payload) && attempt === 0) {
        invalidateToken(accessToken);
        continue;
      }
      return decodeTransparentPng(payload);
    }
    throw new Error("cutout_unavailable");
  } catch (error) {
    if (error instanceof Error && error.message === "image_invalid") {
      throw error;
    }
    throw new Error("cutout_unavailable");
  } finally {
    clearTimeout(timeout);
  }
}

function credentialsFromEnvironment(): BaiduCutoutCredentials | null {
  const apiKey = process.env.BAIDU_API_KEY?.trim();
  const secretKey = process.env.BAIDU_SECRET_KEY?.trim();
  return apiKey && secretKey ? { apiKey, secretKey } : null;
}

async function prepareBaiduInput(source: Blob) {
  let normalized: Buffer;
  try {
    const input = Buffer.from(await source.arrayBuffer());
    const image = sharp(input, { limitInputPixels: 25_000_000 }).rotate();
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      Math.min(metadata.width, metadata.height) < 128
    ) {
      throw new Error("image_invalid");
    }
    const result = await image
      .resize({
        width: 3000,
        height: 3000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .toBuffer({ resolveWithObject: true });
    if (Math.min(result.info.width, result.info.height) < 128) {
      throw new Error("image_invalid");
    }
    normalized = result.data;
  } catch (error) {
    if (error instanceof Error && error.message === "image_invalid") {
      throw error;
    }
    throw new Error("image_invalid");
  }

  const encoded = normalized.toString("base64");
  if (encoded.length > BASE64_INPUT_LIMIT_BYTES) {
    throw new Error("image_invalid");
  }
  return encoded;
}

async function getBaiduAccessToken(
  credentials: BaiduCutoutCredentials,
  fetcher: typeof fetch,
  signal: AbortSignal,
  now: () => number,
) {
  if (
    tokenCache &&
    sameCredentials(tokenCache, credentials) &&
    tokenCache.expiresAt > now() + 60_000
  ) {
    return tokenCache.accessToken;
  }
  if (tokenRequest && sameCredentials(tokenRequest, credentials)) {
    return tokenRequest.promise;
  }

  const promise = fetchBaiduAccessToken(
    credentials,
    fetcher,
    signal,
    now,
  ).finally(() => {
    if (tokenRequest?.promise === promise) tokenRequest = null;
  });
  tokenRequest = { ...credentials, promise };
  return promise;
}

async function fetchBaiduAccessToken(
  credentials: BaiduCutoutCredentials,
  fetcher: typeof fetch,
  signal: AbortSignal,
  now: () => number,
) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: credentials.apiKey,
    client_secret: credentials.secretKey,
  });
  const response = await fetcher(BAIDU_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("cutout_unavailable");
  const payload = (await response.json()) as {
    access_token?: unknown;
    expires_in?: unknown;
  };
  if (
    typeof payload.access_token !== "string" ||
    payload.access_token.length < 8 ||
    payload.access_token.length > 4096 ||
    typeof payload.expires_in !== "number" ||
    !Number.isFinite(payload.expires_in)
  ) {
    throw new Error("cutout_unavailable");
  }

  const lifetimeSeconds = Math.max(60, payload.expires_in - 300);
  tokenCache = {
    ...credentials,
    accessToken: payload.access_token,
    expiresAt: now() + lifetimeSeconds * 1000,
  };
  return payload.access_token;
}

async function sendCutoutRequest(
  image: string,
  accessToken: string,
  fetcher: typeof fetch,
  signal: AbortSignal,
) {
  const endpoint = new URL(BAIDU_CUTOUT_ENDPOINT);
  endpoint.searchParams.set("access_token", accessToken);
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      image,
      method: "auto",
      refine_mask: "true",
      return_form: "rgba",
    }),
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("cutout_unavailable");
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > RESPONSE_LIMIT_CHARS) {
    throw new Error("cutout_unavailable");
  }
  const text = await response.text();
  if (text.length < 2 || text.length > RESPONSE_LIMIT_CHARS) {
    throw new Error("cutout_unavailable");
  }
  try {
    return JSON.parse(text) as {
      error_code?: unknown;
      image?: unknown;
      log_id?: unknown;
    };
  } catch {
    throw new Error("cutout_unavailable");
  }
}

function decodeTransparentPng(payload: { image?: unknown }) {
  if (
    typeof payload.image !== "string" ||
    payload.image.length < PNG_SIGNATURE.length ||
    payload.image.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(payload.image)
  ) {
    throw new Error("cutout_unavailable");
  }
  const bytes = Buffer.from(payload.image, "base64");
  if (
    bytes.byteLength < PNG_SIGNATURE.length ||
    bytes.byteLength > OUTPUT_LIMIT_BYTES ||
    !PNG_SIGNATURE.every((value, index) => bytes[index] === value)
  ) {
    throw new Error("cutout_unavailable");
  }
  return new Blob([copyArrayBuffer(bytes)], { type: "image/png" });
}

function isExpiredTokenResponse(payload: { error_code?: unknown }) {
  return payload.error_code === 110 || payload.error_code === 111;
}

function invalidateToken(accessToken: string) {
  if (tokenCache?.accessToken === accessToken) tokenCache = null;
}

function sameCredentials(
  left: BaiduCutoutCredentials,
  right: BaiduCutoutCredentials,
) {
  return left.apiKey === right.apiKey && left.secretKey === right.secretKey;
}

function copyArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
