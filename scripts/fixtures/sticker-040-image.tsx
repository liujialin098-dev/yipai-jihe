import type { CSSProperties } from "react";

// Browser fixture only: production uses next/image. Keep the same fill geometry.
export default function Image({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // biome-ignore lint/performance/noImgElement: standalone browser fixture has no Next image server.
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        inset: 0,
        ...style,
      }}
    />
  );
}
