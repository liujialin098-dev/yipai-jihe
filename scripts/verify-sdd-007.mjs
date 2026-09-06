import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function filesUnder(path) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(absolute, entry.name);
    if (entry.isDirectory()) return filesUnder(relative(root, child));
    return [relative(root, child).replaceAll("\\", "/")];
  });
}

const requiredPaths = [
  "app/page.tsx",
  "app/wardrobe/page.tsx",
  "app/wardrobe/new/page.tsx",
  "app/recommendations/page.tsx",
  "app/favorites/page.tsx",
  "app/settings/page.tsx",
  "app/settings/preferences/page.tsx",
  "components/brand-mark.tsx",
  "public/brand/yipai-jihe-logo-mark-v2.png",
  "public/brand/yipai-jihe-app-icon-v1.png",
  "README.md",
  ".env.example",
  "progress.md",
  "AGENTS.md",
  "specs/007-release-deploy/spec.md",
  "specs/007-release-deploy/plan.md",
  "specs/007-release-deploy/tasks.md",
  "supabase/migrations/20260820150709_app_foundation.sql",
  "supabase/migrations/20260820152608_tighten_foundation_grants.sql",
  "supabase/migrations/20260821171047_wardrobe_core.sql",
  "supabase/migrations/20260821223000_ai_item_ingestion.sql",
  "supabase/migrations/20260823172604_daily_recommendations.sql",
  "supabase/migrations/20260823180500_outfit_feedback.sql",
  "supabase/migrations/20260825193817_personalized_context.sql",
];
for (const path of requiredPaths) {
  check(existsSync(join(root, path)), `缺少发布必需文件：${path}`);
}

const packageJson = JSON.parse(read("package.json"));
for (const script of [
  "check",
  "build",
  "verify:sdd-001",
  "verify:sdd-003",
  "verify:sdd-004",
  "verify:sdd-005",
  "verify:sdd-006",
  "verify:sdd-007",
  "verify:sdd-012",
]) {
  check(Boolean(packageJson.scripts?.[script]), `缺少 npm 脚本：${script}`);
}

const envExample = read(".env.example");
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "OPENAI_API_KEY",
  "OPENAI_VISION_MODEL",
  "DASHSCOPE_API_KEY",
  "DASHSCOPE_API_HOST",
  "QWEN_RECOMMENDATION_MODEL",
]) {
  check(new RegExp(`^${key}=`, "m").test(envExample), `环境模板缺少：${key}`);
}
check(
  !/^NEXT_PUBLIC_(?:OPENAI|DASHSCOPE|QWEN|SECRET|SUPABASE_SECRET|SERVICE_ROLE)[^=]*=/m.test(
    envExample,
  ),
  "环境模板把服务端秘密暴露为 NEXT_PUBLIC_ 变量",
);

const sourceFiles = ["app", "components", "lib"]
  .flatMap(filesUnder)
  .filter((path) => [".ts", ".tsx"].includes(extname(path)));
for (const path of sourceFiles) {
  const source = read(path);
  if (/^[\s\r\n]*["']use client["'];/m.test(source)) {
    check(
      !/(?:OPENAI_API_KEY|DASHSCOPE_API_KEY|SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY)/.test(
        source,
      ),
      `客户端模块引用服务端秘密：${path}`,
    );
  }
}

const readme = existsSync(join(root, "README.md")) ? read("README.md") : "";
for (const keyword of [
  "5 分钟演示",
  "supabase/migrations/",
  "npm run verify:sdd-007",
  "OPENAI_API_KEY",
  "已知限制",
]) {
  check(readme.includes(keyword), `README 缺少发布说明：${keyword}`);
}

const homePage = read("app/page.tsx");
const wardrobePage = read("app/wardrobe/page.tsx");
const wardrobeActions = read("app/wardrobe/actions.ts");
const demoLoader = read("components/wardrobe/demo-loader.tsx");
const layout = read("app/layout.tsx");
const statusHeader = read("components/status-header.tsx");
const authGateway = read("components/auth/auth-entry-gateway.tsx");
check(
  !homePage.includes("加载 24 件") &&
    !demoLoader.includes("检查并补齐演示数据"),
  "仍存在过时或面向开发者的演示数据文案",
);
check(
  wardrobePage.includes("viewer?.isAnonymous === true") &&
    wardrobePage.includes("composition.realCount === 0") &&
    wardrobePage.includes("composition.demoCount < DEMO_WARDROBE.length"),
  "衣橱页未按体验身份、真实衣物和演示完整度限制入口",
);
check(
  wardrobeActions.includes("supabase.auth.getUser()") &&
    wardrobeActions.includes("user.is_anonymous !== true") &&
    wardrobeActions.includes('.is("demo_key", null)'),
  "演示衣橱 Action 缺少服务端身份或真实衣物防绕过检查",
);
check(
  demoLoader.includes("继续加载演示衣橱"),
  "演示衣橱缺少部分失败后的继续加载入口",
);
check(
  layout.includes("/brand/yipai-jihe-app-icon-v1.png") &&
    statusHeader.includes("<BrandMark") &&
    authGateway.includes("<BrandMark"),
  "确认的品牌标志尚未完整接入站点图标、顶部栏和账号入口",
);

const demoImages = filesUnder("public/demo-wardrobe").filter(
  (path) => extname(path) === ".webp",
);
const testImages = filesUnder("public/test-wardrobe").filter((path) =>
  [".jpg", ".jpeg", ".png", ".webp"].includes(extname(path)),
);
check(demoImages.length >= 20, `演示衣物图片不足 20 张：${demoImages.length}`);
check(testImages.length >= 10, `识别测试图片不足 10 张：${testImages.length}`);

const migrationFiles = filesUnder("supabase/migrations").filter(
  (path) => extname(path) === ".sql",
);
check(
  migrationFiles.length >= 6,
  `数据库迁移数量异常：${migrationFiles.length}`,
);
for (const path of migrationFiles) {
  check(statSync(join(root, path)).size > 0, `空数据库迁移：${path}`);
}

if (failures.length > 0) {
  console.error("SDD-007 发布审计失败：");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("核心路由：7/7");
  console.log(`演示图片：${demoImages.length}；识别样本：${testImages.length}`);
  console.log(`数据库迁移：${migrationFiles.length}`);
  console.log("环境变量、客户端密钥边界、文档与发布文件审计通过");
  console.log("SDD-007 静态发布门禁通过");
}
