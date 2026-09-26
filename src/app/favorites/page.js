import Favorites from "@/components/Favorites";

export const metadata = {
  title: "Favorites",
  description: "The works you have saved.",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return <Favorites />;
}
