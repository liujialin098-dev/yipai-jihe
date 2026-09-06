import "server-only";
import { execFile } from "node:child_process";
import { createWeatherCredential } from "./auth";

// Windows uses the existing system-network compatibility pattern, never command-line secrets.
export async function requestWeatherJson(path: string): Promise<unknown> {
  if (
    !/^\/(weather\/v1\/(current|daily)\/|geo\/v2\/city\/lookup\?)/.test(path) ||
    /[\r\n#]/.test(path)
  )
    throw new Error("weather_invalid_path");
  const { host, token } = createWeatherCredential();
  const url = `https://${host}${path}`;
  if (process.platform !== "win32") {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("weather_request_failed");
    return response.json();
  }
  const environment: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV };
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
  environment.WEATHER_REQUEST_TOKEN = token;
  environment.WEATHER_REQUEST_URL = url;
  const script = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
try {
  $r = Invoke-WebRequest -Uri $env:WEATHER_REQUEST_URL -Headers @{Authorization="Bearer $env:WEATHER_REQUEST_TOKEN"} -SkipHttpErrorCheck -MaximumRedirection 0 -TimeoutSec 7
  if ([int]$r.StatusCode -eq 200) { [Console]::Out.Write([string]$r.Content) } else { exit 1 }
} catch { exit 1 }
`;
  return new Promise((resolve, reject) => {
    execFile(
      "pwsh.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: environment,
        windowsHide: true,
        timeout: 8_000,
        maxBuffer: 1024 * 1024,
        encoding: "utf8",
      },
      (error, stdout) => {
        if (error) {
          reject(new Error("weather_request_failed"));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error("weather_invalid_response"));
        }
      },
    );
  });
}
