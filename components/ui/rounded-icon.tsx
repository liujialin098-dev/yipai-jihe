import type { ReactNode } from "react";

// Navigation and feature-entry glyphs share curved silhouettes, not brand artwork.
const shapes: Record<RoundedIconName, { body: string; detail?: ReactNode }> = {
  home: {
    body: "M4 9.4 9.5 4.8Q12 2.7 14.5 4.8L20 9.4Q21 10.3 21 11.7V17.5Q21 21 17.5 21H6.5Q3 21 3 17.5V11.7Q3 10.3 4 9.4Z",
    detail: <path d="M9 20.7V16.3Q9 13.5 12 13.5T15 16.3V20.7" />,
  },
  recommendations: {
    body: "M10.7 4Q11.2 2.2 11.8 4L13.2 8.2Q13.7 9.7 15.2 10.2L19.3 11.6Q21.1 12.2 19.3 12.8L15.2 14.2Q13.7 14.7 13.2 16.2L11.8 20.4Q11.2 22.2 10.7 20.4L9.3 16.2Q8.8 14.7 7.3 14.2L3.2 12.8Q1.4 12.2 3.2 11.6L7.3 10.2Q8.8 9.7 9.3 8.2Z",
    detail: <path d="M19.5 3V6M18 4.5H21" />,
  },
  add: { body: "", detail: <path d="M12 5V19M5 12H19" /> },
  stickers: {
    body: "M7.5 3.5H16.5Q20.5 3.5 20.5 7.5V13.3Q20.5 14.5 19.6 15.4L15.4 19.6Q14.5 20.5 13.3 20.5H7.5Q3.5 20.5 3.5 16.5V7.5Q3.5 3.5 7.5 3.5Z",
    detail: <path d="M20 14H17Q14 14 14 17V20M8 9H11M8 12.5H10" />,
  },
  inspiration: {
    body: "M7 3.5H17Q20.5 3.5 20.5 7V17Q20.5 20.5 17 20.5H7Q3.5 20.5 3.5 17V7Q3.5 3.5 7 3.5Z",
    detail: (
      <>
        <rect x="7.5" y="7.5" width="4" height="4" rx="1.2" />
        <path d="M15 8H16.5M15 11H16.5M7.5 15H16.5M7.5 17.5H13" />
      </>
    ),
  },
  wardrobe: {
    body: "M8.1 3.7Q12 7.5 15.9 3.7L20.6 6.2Q21.5 6.7 21.1 7.8L20 10.9Q19.7 11.8 18.8 11.5L17.3 11V18.5Q17.3 20.5 15.3 20.5H8.7Q6.7 20.5 6.7 18.5V11L5.2 11.5Q4.3 11.8 4 10.9L2.9 7.8Q2.5 6.7 3.4 6.2Z",
    detail: <path d="M9 17.5H15" />,
  },
  favorites: {
    body: "M12 6.3C8.4 1.7 2.7 4.3 3.1 9.6C3.4 13.6 8.1 17.6 10.8 19.5Q12 20.3 13.2 19.5C15.9 17.6 20.6 13.6 20.9 9.6C21.3 4.3 15.6 1.7 12 6.3Z",
  },
  moon: {
    body: "M19.9 14.1A8.8 8.8 0 0 1 9.9 4.1Q10.1 3.1 9.1 3.5A8.9 8.9 0 1 0 20.5 14.9Q20.9 13.9 19.9 14.1Z",
  },
  sun: {
    body: "M16.5 12A4.5 4.5 0 1 1 7.5 12A4.5 4.5 0 1 1 16.5 12Z",
    detail: (
      <path d="M12 2.5V4M12 20V21.5M2.5 12H4M20 12H21.5M5.3 5.3L6.4 6.4M17.6 17.6L18.7 18.7M5.3 18.7L6.4 17.6M17.6 6.4L18.7 5.3" />
    ),
  },
};

export type RoundedIconName =
  | "home"
  | "recommendations"
  | "add"
  | "stickers"
  | "inspiration"
  | "wardrobe"
  | "favorites"
  | "moon"
  | "sun";

/** Decorative by design: the parent link/button supplies the accessible name. */
export function RoundedIcon({
  name,
  className = "",
}: {
  name: RoundedIconName;
  className?: string;
}) {
  const { body, detail } = shapes[name];
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.85"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`rounded-app-icon ${className}`}
    >
      {body ? (
        <>
          <path
            d={body}
            fill="currentColor"
            stroke="none"
            className="rounded-icon-tint"
          />
          <path d={body} />
        </>
      ) : null}
      {detail}
    </svg>
  );
}
