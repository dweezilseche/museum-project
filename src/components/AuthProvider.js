"use client";

import { SessionProvider } from "next-auth/react";

// Exposes the Auth.js session to Client Components via `useSession()`.
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
