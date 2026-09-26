import { ImageResponse } from "next/og";

import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The default social-share card for the site. Generated at build time.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#16130f",
          color: "#faf9f7",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#faf9f7",
            color: "#16130f",
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          M
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 108, lineHeight: 1 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 34, color: "#a29e97", maxWidth: 900 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
