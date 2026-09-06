import { execFileSync } from "node:child_process";
import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Local credential preparation only. Never prints private material or calls APIs.
const root = fileURLToPath(new URL("../", import.meta.url));
const filename = ".env.qweather-private.pem";
const path = new URL(`../${filename}`, import.meta.url);

try {
  execFileSync("git", ["check-ignore", "--quiet", filename], {
    cwd: root,
    stdio: "ignore",
    windowsHide: true,
  });

  let privateKey;
  let created = false;
  if (existsSync(path)) {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 4096) {
      throw new Error("Invalid local key file");
    }
    privateKey = createPrivateKey(readFileSync(path));
  } else {
    privateKey = generateKeyPairSync("ed25519").privateKey;
    created = true;
  }
  if (privateKey.asymmetricKeyType !== "ed25519") {
    throw new Error("Unexpected key type");
  }
  const publicKey = createPublicKey(privateKey);
  const testMessage = Buffer.from("yipai-jihe-qweather-key-self-test");
  if (
    !verify(null, testMessage, publicKey, sign(null, testMessage, privateKey))
  ) {
    throw new Error("Key self-test failed");
  }
  if (created) {
    // Exclusive creation prevents replacing an existing credential on retries.
    writeFileSync(path, privateKey.export({ type: "pkcs8", format: "pem" }), {
      flag: "wx",
      mode: 0o600,
    });
  }
  console.log(
    created ? "Local key created; Git ignored." : "Existing local key reused.",
  );
  console.log("Ed25519 signature self-test passed. PUBLIC KEY ONLY:");
  console.log(publicKey.export({ type: "spki", format: "pem" }).toString());
} catch {
  console.error(
    "Key setup stopped. Check Git ignore rules and local key file; no existing key was overwritten.",
  );
  process.exitCode = 1;
}
