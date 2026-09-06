import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "收藏" };

export default function FavoritesPage() {
  redirect("/diary?view=favorites");
}
