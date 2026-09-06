import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/auth/viewer";
import "./globals.css";

const playful = localFont({
  src: "../public/fonts/ZCOOLKuaiLe-Regular.ttf",
  variable: "--font-playful",
  weight: "400",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "衣拍即合",
    template: "%s · 衣拍即合",
  },
  description: "先认识你的衣橱，再给出真正穿得上的搭配建议。",
  icons: {
    icon: [
      {
        url: "/brand/yipai-jihe-app-icon-v1.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/brand/yipai-jihe-app-icon-v1.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <html
      lang="zh-CN"
      className={`light h-full antialiased ${playful.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background">
        <AppShell viewer={viewer}>{children}</AppShell>
      </body>
    </html>
  );
}
