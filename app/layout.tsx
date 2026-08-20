import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/auth/viewer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "衣拍即合",
    template: "%s · 衣拍即合",
  },
  description: "先认识你的衣橱，再给出真正穿得上的搭配建议。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-[#eceef3]">
        <AppShell viewer={viewer}>{children}</AppShell>
      </body>
    </html>
  );
}
