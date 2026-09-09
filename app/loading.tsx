import { BrandMotion } from "@/components/brand-motion";

export default function Loading() {
  return (
    <div className="brand-page-loader" aria-busy="true">
      <BrandMotion variant="loader" label="正在准备页面" />
    </div>
  );
}
