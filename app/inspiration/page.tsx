import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InspirationFeed } from "@/components/inspiration/inspiration-feed";
import { PageHeading } from "@/components/page-heading";
import { getViewer } from "@/lib/auth/viewer";
import { getFashionFeedData } from "@/lib/inspiration/data";

export const metadata: Metadata = { title: "时尚灵感" };

export default async function InspirationPage() {
  if (!(await getViewer())) redirect("/");
  const data = await getFashionFeedData();
  return (
    <div className="page-enter px-5 pt-4">
      <div className="inspiration-cover overflow-hidden rounded-[1.9rem] p-5">
        <PageHeading title="时尚灵感">
          <div className="flex flex-wrap justify-center gap-2 text-xs font-medium">
            <span className="inspiration-chip rounded-full px-3 py-1.5">
              {data.preferences.unreadEnabled
                ? `${data.unreadCount} 条未读`
                : "未读提示已关闭"}
            </span>
            <span className="inspiration-chip rounded-full px-3 py-1.5">
              Vogue · GQ · Hypebeast
            </span>
          </div>
        </PageHeading>
      </div>

      <InspirationFeed data={data} />
    </div>
  );
}
