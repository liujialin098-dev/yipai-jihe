import { spawnSync } from "node:child_process";
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

// Setup smoke test, not part of the running application. Never logs JWT/private key.
const config = parseEnv(
  readFileSync(new URL("../.env.qweather.local", import.meta.url), "utf8"),
);
const host = config.QWEATHER_API_HOST;
if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*\.qweatherapi\.com$/.test(host ?? "")) {
  throw new Error("Invalid QWeather API host");
}
for (const name of [
  "QWEATHER_DEVELOPER_ID",
  "QWEATHER_PROJECT_ID",
  "QWEATHER_CREDENTIAL_ID",
]) {
  if (!/^[A-Z0-9]{10}$/.test(config[name] ?? ""))
    throw new Error("Invalid QWeather identifier");
}
const privateKey = createPrivateKey(
  readFileSync(new URL("../.env.qweather-private.pem", import.meta.url)),
);
if (privateKey.asymmetricKeyType !== "ed25519")
  throw new Error("Expected Ed25519 key");
const publicPem = createPublicKey(privateKey)
  .export({ type: "spki", format: "pem" })
  .toString()
  .trim();
console.log(
  "Public key SHA-256:",
  createHash("sha256").update(publicPem).digest("hex"),
);
const now = Math.floor(Date.now() / 1000);
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const unsigned = `${encode({ alg: "EdDSA", kid: config.QWEATHER_CREDENTIAL_ID })}.${encode({ iss: config.QWEATHER_DEVELOPER_ID, sub: config.QWEATHER_PROJECT_ID, iat: now - 30, exp: now + 300 })}`;
const token = `${unsigned}.${sign(null, Buffer.from(unsigned), privateKey).toString("base64url")}`;

function sanitize(value) {
  return String(value ?? "")
    .replaceAll(token, "[REDACTED]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED]")
    .slice(0, 350);
}

async function request(path) {
  const url = `https://${host}${path}`;
  let status, body, cors;
  if (process.platform === "win32") {
    const environment = {};
    for (const key of [
      "PATH",
      "PATHEXT",
      "SystemRoot",
      "WINDIR",
      "TEMP",
      "TMP",
      "PSModulePath",
    ]) {
      if (process.env[key]) environment[key] = process.env[key];
    }
    environment.QWEATHER_TEST_TOKEN = token;
    environment.QWEATHER_TEST_URL = url;
    const script = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
  $r = Invoke-WebRequest -Uri $env:QWEATHER_TEST_URL -Headers @{Authorization="Bearer $env:QWEATHER_TEST_TOKEN"; Origin='http://localhost:3000'} -SkipHttpErrorCheck -MaximumRedirection 0 -TimeoutSec 12
  @{status=[int]$r.StatusCode; body=[string]$r.Content; cors=[string]$r.Headers['Access-Control-Allow-Origin']} | ConvertTo-Json -Compress
} catch { [Console]::Out.Write('{"status":0,"body":"{}","cors":""}') }
`;
    const result = spawnSync(
      "pwsh.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: environment,
        windowsHide: true,
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      },
    );
    if (result.status !== 0)
      throw new Error("Local weather network request failed");
    ({ status, body, cors } = JSON.parse(result.stdout));
  } else {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: "http://localhost:3000",
      },
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    status = response.status;
    body = await response.text();
    cors = response.headers.get("access-control-allow-origin");
  }
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    data = {};
  }
  console.log(
    JSON.stringify({
      endpoint: path.split("?")[0],
      status,
      cors,
      code: data.code,
      error: sanitize(
        data.error?.detail ?? data.error?.title ?? data.detail ?? data.title,
      ),
    }),
  );
  if (status !== 200 || (data.code && data.code !== "200"))
    throw new Error(
      "Weather API did not return success; stop without fallback or extra requests",
    );
  return data;
}

try {
  // Wuhan is a fixed diagnostic sample, not the user's location or app default.
  const current = await request(
    "/weather/v1/current/30.59/114.30?lang=zh&localTime=true",
  );
  if (!Number.isFinite(current.temperature?.value) || !current.condition?.text)
    throw new Error("Missing current weather fields");
  console.log(
    JSON.stringify({
      sampleCity: "武汉（固定连通性样本）",
      temperature: current.temperature,
      feelsLike: current.feelsLike,
      condition: current.condition,
      fetchedAt: new Date().toISOString(),
    }),
  );
  const geo = await request(
    "/geo/v2/city/lookup?location=wuhan&range=cn&lang=zh&number=1",
  );
  if (!geo.location?.[0]?.name) throw new Error("Missing city fields");
  console.log(
    JSON.stringify({
      city: geo.location[0].name,
      timezone: geo.location[0].tz,
    }),
  );
  const daily = await request(
    "/weather/v1/daily/30.59/114.30?days=3&lang=zh&localTime=true",
  );
  if (!Array.isArray(daily.days) || daily.days.length < 2)
    throw new Error("Missing daily forecasts");
  console.log(
    JSON.stringify({
      forecasts: daily.days.map((day) => ({
        start: day.forecastStartTime,
        end: day.forecastEndTime,
        min: day.temperatureMin,
        max: day.temperatureMax,
        daytime: day.daytime?.condition,
      })),
    }),
  );
  console.log(
    "QWeather connection checks passed. Browser CORS/preflight and app integration still require separate verification.",
  );
} catch (error) {
  console.error(sanitize(error.message));
  process.exitCode = 1;
}
