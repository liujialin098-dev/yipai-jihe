import { spawn } from "node:child_process";

const IMAGES_URL = "https://api.openai.com/v1/images/generations";
const MAX_IMAGE_RESPONSE_OUTPUT = 20 * 1024 * 1024;

type ImageRequest = {
  apiKey: string;
  body: string;
  signal: AbortSignal;
};

export async function requestOpenAiImage({
  apiKey,
  body,
  signal,
}: ImageRequest): Promise<Response> {
  if (process.platform === "win32") {
    return requestWithWindowsNetworkStack({ apiKey, body, signal });
  }

  return fetch(IMAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
    signal,
  });
}

function requestWithWindowsNetworkStack({
  apiKey,
  body,
  signal,
}: ImageRequest): Promise<Response> {
  const script = `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$payloadBase64 = [Console]::In.ReadToEnd()
$payload = [Convert]::FromBase64String($payloadBase64)
$headers = @{ Authorization = "Bearer $env:OPENAI_API_KEY" }
$response = Invoke-WebRequest -Uri 'https://api.openai.com/v1/images/generations' -Method Post -Headers $headers -ContentType 'application/json' -Body $payload -TimeoutSec 60 -SkipHttpErrorCheck
$requestId = $response.Headers['x-request-id']
[Console]::Out.Write([string][int]$response.StatusCode + [Environment]::NewLine)
[Console]::Out.Write([string]$requestId + [Environment]::NewLine)
[Console]::Out.Write([string]$response.Content)
`;

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("The operation was aborted", "AbortError"));
      return;
    }

    const child = spawn(
      "pwsh.exe",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script],
      {
        env: windowsChildEnvironment(apiKey),
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      },
    );
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      callback();
    };
    const abort = () => {
      child.kill();
      finish(() =>
        reject(new DOMException("The operation was aborted", "AbortError")),
      );
    };
    signal.addEventListener("abort", abort, { once: true });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > MAX_IMAGE_RESPONSE_OUTPUT) child.kill();
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 256_000) child.kill();
    });
    child.stdin.on("error", (error) => finish(() => reject(error)));
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          reject(
            new Error(
              `Windows OpenAI image transport failed (${code}): ${stderr.slice(0, 240)}`,
            ),
          );
          return;
        }

        const firstBreak = stdout.indexOf("\n");
        const secondBreak = stdout.indexOf("\n", firstBreak + 1);
        const status = Number(stdout.slice(0, firstBreak).trim());
        if (
          firstBreak < 0 ||
          secondBreak < 0 ||
          !Number.isInteger(status) ||
          status < 200 ||
          status > 599
        ) {
          reject(
            new Error("Windows OpenAI image transport returned invalid output"),
          );
          return;
        }

        const requestId = stdout.slice(firstBreak + 1, secondBreak).trim();
        const headers = new Headers({ "Content-Type": "application/json" });
        if (requestId) headers.set("x-request-id", requestId);
        resolve(
          new Response(stdout.slice(secondBreak + 1), { status, headers }),
        );
      });
    });
    child.stdin.end(Buffer.from(body, "utf8").toString("base64"), "ascii");
  });
}

function windowsChildEnvironment(apiKey: string): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: apiKey,
  };
  for (const key of [
    "PATH",
    "PATHEXT",
    "PSModulePath",
    "SystemRoot",
    "TEMP",
    "TMP",
    "WINDIR",
  ]) {
    const value = process.env[key];
    if (value) environment[key] = value;
  }
  return environment;
}
