import { absoluteUrl } from "@/lib/site";

// Tell crawlers what to index. Private and transactional routes are kept out;
// everything else (home, gallery, artwork pages) is open.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/favorites",
        "/tickets/mine",
        "/tickets/success",
        "/tickets/cancel",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
