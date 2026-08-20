const CONFIG_ERROR = "应用连接配置不完整，请检查 Supabase 公开环境变量后重试。";

export class SupabaseConfigError extends Error {
  constructor() {
    super(CONFIG_ERROR);
    this.name = "SupabaseConfigError";
  }
}

export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new SupabaseConfigError();
  }

  return { supabaseUrl, supabasePublishableKey };
}
