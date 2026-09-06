import { getFashionFeedData } from "@/lib/inspiration/data";

export async function FashionUnreadBadge() {
  try {
    const { unreadCount } = await getFashionFeedData(false);
    if (!unreadCount) return null;
    return (
      <span className="absolute -top-1 -right-1 rounded-full bg-[var(--fashion-coral)] px-1.5 text-[0.6rem] font-bold leading-5 text-[#1d1d1f]">
        {Math.min(unreadCount, 9)}
        {unreadCount > 9 ? "+" : ""}
      </span>
    );
  } catch {
    // The wardrobe home must remain usable when content services are down.
    return null;
  }
}
