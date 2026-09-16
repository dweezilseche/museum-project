import "./globals.css";

import { getArtists } from "@/lib/museum";
import MuseumProvider from "@/components/MuseumProvider";
import Chrome from "@/components/Chrome";

export const metadata = {
  title: "Museum",
  description: "Une collection d'œuvres, présentée artiste par artiste.",
};

export default async function RootLayout({ children }) {
  const artists = await getArtists();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <MuseumProvider artists={artists}>
          <Chrome>{children}</Chrome>
        </MuseumProvider>
      </body>
    </html>
  );
}
