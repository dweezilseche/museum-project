"use server";

import { auth } from "@/lib/auth";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/db";

// All favorite mutations re-check the session on the server: client-side gating
// is only for UX, never for authorization.
async function currentUserId() {
  const session = await auth();
  const id = session?.user?.id;
  return id ? Number(id) : null;
}

export async function fetchFavorites() {
  const userId = await currentUserId();
  if (!userId) return [];
  return listFavorites(userId);
}

export async function toggleFavorite(workId, shouldAdd) {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Not authenticated" };

  if (shouldAdd) addFavorite(userId, String(workId));
  else removeFavorite(userId, String(workId));

  return { ok: true };
}
