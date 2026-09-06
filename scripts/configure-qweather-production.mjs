import { spawnSync } from "node:child_process";
import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

// 仅将已验证的天气配置经 stdin 写入指定项目；不输出密钥，不覆盖已有变量。
const root = fileURLToPath(new URL("..", import.meta.url));
const linked = JSON.parse(
  readFileSync(new URL("../.vercel/project.json", import.meta.url), "utf8"),
);
if (
  linked.projectId !== "prj_ocx4NiuPlME8hIW3Zosc76yCBz8n" ||
  linked.orgId !== "team_98Wb3gaXY0oorwkvQcGLE1Hd"
) {
  throw new Error("部署目标不匹配，未写入配置。");
}
const source = parseEnv(
  readFileSync(new URL("../.env.qweather.local", import.meta.url), "utf8"),
);
const entries = {};
for (const name of [
  "QWEATHER_API_HOST",
  "QWEATHER_DEVELOPER_ID",
  "QWEATHER_PROJECT_ID",
  "QWEATHER_CREDENTIAL_ID",
]) {
  const value = source[name]?.trim();
  const pattern =
    name === "QWEATHER_API_HOST"
      ? /^[a-z0-9]+(?:\.[a-z0-9]+)*\.qweatherapi\.com$/
      : /^[A-Z0-9]{10}$/;
  if (!value || !pattern.test(value)) throw new Error(`配置无效：${name}`);
  entries[name] = value;
}
entries.QWEATHER_PRIVATE_KEY = readFileSync(
  new URL("../.env.qweather-private.pem", import.meta.url),
  "utf8",
);
if (
  createPrivateKey(entries.QWEATHER_PRIVATE_KEY).asymmetricKeyType !== "ed25519"
) {
  throw new Error("私钥类型无效。");
}
if (!process.argv.includes("--apply")) {
  console.log(
    "五项天气配置和目标项目校验通过；使用 --apply 才会写入 Production。",
  );
} else {
  for (const [name, value] of Object.entries(entries)) {
    const args = [
      "vercel",
      "env",
      "add",
      name,
      "production",
      "--sensitive",
      "--yes",
      "--scope",
      "jialin-d583",
    ];
    const result =
      process.platform === "win32"
        ? spawnSync("cmd.exe", ["/d", "/s", "/c", `npx ${args.join(" ")}`], {
            cwd: root,
            input: value,
            encoding: "utf8",
            windowsHide: true,
            timeout: 60_000,
          })
        : spawnSync("npx", args, {
            cwd: root,
            input: value,
            encoding: "utf8",
            timeout: 60_000,
          });
    if (result.status !== 0) {
      // 不打印第三方命令的原始输出，避免错误信息意外回显凭据。
      throw new Error(
        `${name} 未确认写入成功，请检查变量名称列表；未自动覆盖或重试。`,
      );
    }
    console.log(`${name} 已保存为 Production Secret。`);
  }
}
