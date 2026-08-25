import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SECRET_KEY;

function ensureConfigured(value, label) {
  if (!value || /your_|placeholder/i.test(value)) {
    throw new Error(`${label} 尚未在 .env.local 中安全配置。`);
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readSecret(label) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdout.isTTY || !stdin.setRawMode) {
      reject(new Error("请在本地交互终端运行，密码不会从参数或管道读取。"));
      return;
    }

    let value = "";
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("操作已取消。"));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          stdout.write("•");
        }
      }
    };

    stdout.write(label);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function findUserByEmail(adminClient, email) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  throw new Error(
    "用户数量超出本地工具的安全扫描范围，请在 Dashboard 中定位账号。 ",
  );
}

async function main() {
  ensureConfigured(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL");
  ensureConfigured(secretKey, "SECRET_KEY");

  const prompt = createInterface({ input: stdin, output: stdout });
  const email = (await prompt.question("输入已绑定邮箱："))
    .trim()
    .toLowerCase();
  prompt.close();

  if (!validateEmail(email)) throw new Error("邮箱格式不正确。");

  const password = await readSecret("输入新密码（至少 8 位）：");
  const confirmation = await readSecret("再次输入新密码：");
  if (password.length < 8) throw new Error("密码至少需要 8 位。");
  if (password !== confirmation) throw new Error("两次输入的密码不一致。");

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const user = await findUserByEmail(adminClient, email);
  if (!user) throw new Error("没有找到对应的已绑定账号，未进行任何修改。");

  const finalPrompt = createInterface({ input: stdin, output: stdout });
  const confirmationText = await finalPrompt.question(
    `即将为账号 ${user.id.slice(0, 8).toUpperCase()} 设置新密码。输入 SET 确认：`,
  );
  finalPrompt.close();
  if (confirmationText !== "SET") throw new Error("操作已取消，账号未修改。");

  const { error } = await adminClient.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: {
      ...(user.user_metadata ?? {}),
      account_password_configured: true,
    },
  });
  if (error) throw error;

  stdout.write(
    `账号 ${user.id.slice(0, 8).toUpperCase()} 的密码已设置。请回到登录页自行输入邮箱和密码验收。\n`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "本地密码设置失败。";
  console.error(message);
  process.exitCode = 1;
});
