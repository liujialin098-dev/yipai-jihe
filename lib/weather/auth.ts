import "server-only";
import { createPrivateKey, sign } from "node:crypto";

export function createWeatherCredential(now = Date.now()) {
  const host = process.env.QWEATHER_API_HOST?.trim() ?? "";
  if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*\.qweatherapi\.com$/.test(host))
    throw new Error("weather_not_configured");
  const developer = process.env.QWEATHER_DEVELOPER_ID?.trim() ?? "";
  const project = process.env.QWEATHER_PROJECT_ID?.trim() ?? "";
  const credential = process.env.QWEATHER_CREDENTIAL_ID?.trim() ?? "";
  if (
    ![developer, project, credential].every((value) =>
      /^[A-Z0-9]{10}$/.test(value),
    )
  )
    throw new Error("weather_not_configured");
  try {
    const key = createPrivateKey(
      (process.env.QWEATHER_PRIVATE_KEY ?? "").replaceAll("\\n", "\n"),
    );
    if (key.asymmetricKeyType !== "ed25519") throw new Error("invalid_key");
    const issued = Math.floor(now / 1000);
    const expiresAt = (issued + 300) * 1000;
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "EdDSA", kid: credential })}.${encode({ iss: developer, sub: project, iat: issued - 30, exp: issued + 300 })}`;
    return {
      host,
      token: `${unsigned}.${sign(null, Buffer.from(unsigned), key).toString("base64url")}`,
      expiresAt,
    };
  } catch {
    throw new Error("weather_not_configured");
  }
}
