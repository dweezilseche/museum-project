import "./globals.css";

import { getArtists } from "@/lib/museum";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/site";
import AuthProvider from "@/components/AuthProvider";
import MuseumProvider from "@/components/MuseumProvider";
import FavoritesProvider from "@/components/FavoritesProvider";
import Chrome from "@/components/Chrome";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "museum",
    "art",
    "collection",
    "paintings",
    "artists",
    "exhibition",
    "gallery",
    "tickets",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

// Sitewide structured data describing the museum itself.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Museum",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: absoluteUrl("/opengraph-image"),
};

export default async function RootLayout({ children }) {
  const artists = await getArtists();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <AuthProvider>
          <MuseumProvider artists={artists}>
            <FavoritesProvider>
              <Chrome>{children}</Chrome>
            </FavoritesProvider>
          </MuseumProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
