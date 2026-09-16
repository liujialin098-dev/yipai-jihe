import type { Metadata } from "next";
import Link from "next/link";
import { SupportLinks } from "@/components/support-links";

export const metadata: Metadata = { title: "数据与隐私说明" };

const sections = [
  {
    title: "账号与衣橱",
    body: "邮箱用于账号登录与恢复；昵称、头像、衣物图片、偏好、收藏及日记用于展示和管理你的衣橱。账号与业务数据目前使用 Supabase 服务存储，应用由 Vercel 托管。",
  },
  {
    title: "图片与 AI",
    body: "衣物识别目前会将图片交给 OpenAI 处理；专业抠图使用百度服务；智能搭配使用千问处理衣物属性和偏好等信息。资讯标题翻译也可能使用 OpenAI，处理的是公开来源标题。不能将当前版本理解为全部数据只在本机或国内处理。",
  },
  {
    title: "定位与天气",
    body: "自动定位需要浏览器或系统的位置许可，坐标会用于查询和风天气。你也可以手动选择城市，或在浏览器及系统设置中撤回位置权限。撤回权限不影响已经发送的请求。",
  },
  {
    title: "本设备数据",
    body: "皮肤、日夜模式及部分拼图草稿会保存在当前设备。清除浏览器站点数据可能丢失这些设置；未注册的体验身份也可能因此无法找回。",
  },
  {
    title: "你的选择与请求",
    body: "可以联系支持提出查询、更正、删除等请求。自助账号注销及独立 AI 授权管理仍在完善中，当前页面不代表这些控制已启用。照片涉及个人信息时，请谨慎上传。",
  },
  {
    title: "删除与保留边界",
    body: "退出登录不会删除账号或衣物。业务数据删除与备份、日志以及供应商留存不是同一个过程；实际保留期限和处理地域仍需进一步核实，不能承诺即时从所有系统消失。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-lg px-5 pt-5 pb-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        返回首页
      </Link>
      <h1 className="app-page-title mt-4">数据与隐私说明</h1>
      <p className="mt-4 text-sm leading-7 text-[var(--foreground)]">
        这份说明帮助你了解现有功能的数据使用情况。正式隐私政策和服务协议仍在完善中，本页不代替完整法律告知或单独授权。
      </p>
      {sections.map(({ title, body }) => (
        <section key={title} className="surface-card mt-5 rounded-[2rem] p-5">
          <h2 className="app-section-title">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {body}
          </p>
        </section>
      ))}
      <SupportLinks />
    </div>
  );
}
