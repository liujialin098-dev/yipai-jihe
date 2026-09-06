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

const roundedBrand = localFont({
  src: "../public/fonts/Fredoka-Variable.ttf",
  variable: "--font-brand-rounded",
  weight: "300 700",
  style: "normal",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Ensemble · 衣拍即合",
    template: "%s · Ensemble",
  },
  description: "先认识你的衣橱，再给出真正穿得上的搭配建议。",
  icons: {
    icon: [
      {
        url: "/brand/ensemble-icon-a-folded-e.png",
        type: "image/png",
        sizes: "1024x1024",
      },
    ],
    apple: [
      {
        url: "/brand/ensemble-icon-a-folded-e.png",
        type: "image/png",
        sizes: "1024x1024",
      },
    ],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <html
      lang="zh-CN"
      className={`light h-full antialiased ${playful.variable} ${roundedBrand.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full bg-background">
        <AppShell viewer={viewer}>{children}</AppShell>
      </body>
    </html>
  );
}
