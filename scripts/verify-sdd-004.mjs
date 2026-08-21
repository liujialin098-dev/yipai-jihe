import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 公开环境变量，无法执行 SDD-004 验证。");
}

const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5l4xAAAAAElFTkSuQmCC",
  "base64",
);

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function createIsolatedClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function createTestSession(label) {
  const client = createIsolatedClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      `${label} 匿名会话创建失败：${error?.message ?? "未知错误"}`,
    );
  }

  const userId = data.user.id;
  const ingestionId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const imagePath = `${userId}/ingestions/${ingestionId}.png`;
  const insert = await client
    .from("wardrobe_ingestions")
    .insert({
      id: ingestionId,
      user_id: userId,
      client_request_id: requestId,
      image_path: imagePath,
      mime_type: "image/png",
      byte_size: TEST_PNG.length,
    })
    .select("id")
    .single();
  if (insert.error) {
    throw new Error(`${label} 入库项目创建失败：${insert.error.message}`);
  }

  const upload = await client.storage
    .from("wardrobe-images")
    .upload(imagePath, TEST_PNG, { contentType: "image/png", upsert: true });
  if (upload.error) {
    throw new Error(`${label} 私有原图上传失败：${upload.error.message}`);
  }

  await client
    .from("wardrobe_ingestions")
    .update({ status: "uploaded" })
    .eq("id", ingestionId);

  return { client, imagePath, ingestionId, requestId, userId };
}

async function verifyOwnAndCrossAccess(owner, other, label) {
  const ownRead = await owner.client
    .from("wardrobe_ingestions")
    .select("id, status")
    .eq("id", owner.ingestionId)
    .single();
  ensure(!ownRead.error, `${label} 无法读取自己的入库项目`);

  const crossRead = await other.client
    .from("wardrobe_ingestions")
    .select("id")
    .eq("id", owner.ingestionId);
  ensure(!crossRead.error, `${label} 交叉读取请求异常`);
  ensure(crossRead.data?.length === 0, `${label} RLS 未阻止交叉读取`);

  const crossUpdate = await other.client
    .from("wardrobe_ingestions")
    .update({ status: "failed" })
    .eq("id", owner.ingestionId)
    .select("id");
  ensure(!crossUpdate.error, `${label} 交叉更新请求异常`);
  ensure(crossUpdate.data?.length === 0, `${label} RLS 未阻止交叉更新`);

  const crossDownload = await other.client.storage
    .from("wardrobe-images")
    .download(owner.imagePath);
  ensure(Boolean(crossDownload.error), `${label} Storage 未阻止交叉读取`);
}

async function verifyIdempotentConfirm(session) {
  const row = {
    user_id: session.userId,
    source_ingestion_id: session.ingestionId,
    image_path: session.imagePath,
    name: "SDD-004 幂等测试衣物",
    category: "tops",
    primary_color: "white",
    material: "cotton",
    style: "minimal",
    seasons: ["spring"],
    occasions: ["casual"],
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await session.client
      .from("wardrobe_items")
      .upsert(row, { onConflict: "user_id,source_ingestion_id" })
      .select("id")
      .single();
    ensure(!result.error, `第 ${attempt + 1} 次幂等确认失败`);
  }

  const count = await session.client
    .from("wardrobe_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.userId)
    .eq("source_ingestion_id", session.ingestionId);
  ensure(!count.error && count.count === 1, "重复确认创建了多条衣物");
}

async function verifyConstraints(session) {
  const invalid = await session.client.from("wardrobe_ingestions").insert({
    user_id: session.userId,
    client_request_id: crypto.randomUUID(),
    image_path: `${session.userId}/ingestions/invalid.gif`,
    mime_type: "image/gif",
    byte_size: 11 * 1024 * 1024,
  });
  ensure(Boolean(invalid.error), "数据库未拒绝无效类型或超大图片");

  const duplicate = await session.client.from("wardrobe_ingestions").insert({
    user_id: session.userId,
    client_request_id: session.requestId,
    image_path: `${session.userId}/ingestions/${crypto.randomUUID()}.png`,
    mime_type: "image/png",
    byte_size: TEST_PNG.length,
  });
  ensure(Boolean(duplicate.error), "稳定请求标识未阻止重复项目");
}

async function verifyFixedSamples() {
  const samples = JSON.parse(
    await readFile(
      new URL(
        "../specs/004-ai-item-ingestion/test-samples.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  ensure(
    Array.isArray(samples) && samples.length === 10,
    "固定样本必须正好 10 张",
  );
  for (const sample of samples) {
    const image = await readFile(new URL(`../${sample.file}`, import.meta.url));
    ensure(
      image.length > 0 && image.length <= 10 * 1024 * 1024,
      `${sample.file} 无效`,
    );
  }
  return samples;
}

function responseOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return null;
}

async function benchmarkAi(samples) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("未配置 OPENAI_API_KEY，本次未执行 10 张真实 AI 准确率验收");
    return;
  }

  const schema = JSON.parse(
    await readFile(
      new URL(
        "../specs/004-ai-item-ingestion/contracts/wardrobe-recognition.schema.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  delete schema.$schema;
  delete schema.title;
  const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
  const results = [];

  for (const sample of samples) {
    const startedAt = Date.now();
    try {
      const image = await readFile(
        new URL(`../${sample.file}`, import.meta.url),
      );
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          store: false,
          temperature: 0.1,
          max_output_tokens: 400,
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "识别图片中最主要的一件衣物，严格按结构化枚举返回。",
                },
                {
                  type: "input_image",
                  image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
                  detail: "low",
                },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "wardrobe_recognition",
              strict: true,
              schema,
            },
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      ensure(response.ok, `OpenAI ${response.status}`);
      const payload = await response.json();
      const output = responseOutputText(payload);
      ensure(output, "OpenAI 未返回结构化文本");
      const actual = JSON.parse(output);
      results.push({
        file: sample.file,
        expectedCategory: sample.category,
        actualCategory: actual.category,
        categoryCorrect: actual.category === sample.category,
        durationMs: Date.now() - startedAt,
        error: null,
      });
    } catch (error) {
      results.push({
        file: sample.file,
        expectedCategory: sample.category,
        actualCategory: null,
        categoryCorrect: false,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  const correct = results.filter((result) => result.categoryCorrect).length;
  const durations = results
    .map((result) => result.durationMs)
    .sort((a, b) => a - b);
  console.log(
    JSON.stringify({ model, correct, total: results.length, results }, null, 2),
  );
  console.log(
    `真实 AI 类别准确率 ${correct}/${results.length}，中位耗时 ${durations[Math.floor(durations.length / 2)]}ms`,
  );
  ensure(correct >= 8, "真实 AI 类别准确率未达到 8/10");
}

async function cleanup(session) {
  await session.client
    .from("wardrobe_items")
    .delete()
    .eq("source_ingestion_id", session.ingestionId);
  await session.client.storage
    .from("wardrobe-images")
    .remove([session.imagePath]);
  await session.client
    .from("wardrobe_ingestions")
    .delete()
    .eq("id", session.ingestionId);
}

async function main() {
  const samples = await verifyFixedSamples();
  const sessions = [];
  try {
    sessions.push(await createTestSession("A"));
    sessions.push(await createTestSession("B"));
    const [sessionA, sessionB] = sessions;

    await Promise.all([
      verifyOwnAndCrossAccess(sessionA, sessionB, "A 到 B"),
      verifyOwnAndCrossAccess(sessionB, sessionA, "B 到 A"),
      verifyConstraints(sessionA),
    ]);
    await verifyIdempotentConfirm(sessionA);
    await benchmarkAi(samples);

    console.log("10 张固定安全样本边界检查通过");
    console.log("两组匿名会话的入库记录与原图隔离通过");
    console.log("同一项目连续确认 3 次仅产生 1 条正式衣物");
  } finally {
    await Promise.all(sessions.map(cleanup));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "SDD-004 验证失败");
  process.exitCode = 1;
});
