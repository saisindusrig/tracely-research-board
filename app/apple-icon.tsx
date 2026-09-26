import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the Warrant card-and-tick mark on paper. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f4efe3" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="5" y="8" width="20" height="16" rx="1.4" transform="rotate(-5 15 16)" fill="#fffdf7" stroke="#1d2a44" strokeWidth="1.6" />
          <path d="M8.2 13.4c3.6-.3 7.2-.3 10.8-.1" transform="rotate(-5 15 16)" stroke="#b8412c" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <path d="M10.6 18.8c1.7 1.2 3.1 2.7 4.4 4.5 3.6-6.8 8.2-12.6 13.8-17.6" stroke="#243b63" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    ),
    size
  );
}
