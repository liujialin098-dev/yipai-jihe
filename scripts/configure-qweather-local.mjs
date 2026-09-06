import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import { createPrivateKey } from "node:crypto";

// Transfer existing secrets to an ignored local-only runtime file, without terminal output.
const destination = new URL("../.env.development.local", import.meta.url);
execFileSync("git", ["check-ignore", "--quiet", ".env.development.local"]);
const config = parseEnv(
  readFileSync(new URL("../.env.qweather.local", import.meta.url), "utf8"),
);
const key = readFileSync(
  new URL("../.env.qweather-private.pem", import.meta.url),
  "utf8",
);
if (createPrivateKey(key).asymmetricKeyType !== "ed25519")
  throw new Error("Invalid key");
const entries = Object.fromEntries(
  [
    "QWEATHER_API_HOST",
    "QWEATHER_DEVELOPER_ID",
    "QWEATHER_PROJECT_ID",
    "QWEATHER_CREDENTIAL_ID",
  ].map((name) => {
    if (!config[name] || !/^[a-zA-Z0-9.]+$/.test(config[name]))
      throw new Error("Invalid configuration");
    return [name, config[name]];
  }),
);
entries.QWEATHER_PRIVATE_KEY = key;
if (existsSync(destination)) {
  const existing = parseEnv(readFileSync(destination, "utf8"));
  if (Object.entries(entries).some(([name, value]) => existing[name] !== value))
    throw new Error(
      "Existing development environment differs; not overwritten",
    );
  console.log("Existing QWeather development configuration preserved.");
} else {
  writeFileSync(
    destination,
    `${Object.entries(entries)
      .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
      .join("\n")}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    "QWeather development configuration saved to ignored runtime file. No production changes.",
  );
}
