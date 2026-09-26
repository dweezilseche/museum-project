"use server";

import bcrypt from "bcryptjs";

import { getUserByEmail, createUser } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create an account. Validation and hashing happen on the server; the client
// signs in right after with the same credentials. Returns a plain object so it
// can drive `useActionState` / inline error messages in the modal.
export async function registerUser(_prevState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) {
    return { error: "Invalid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (getUserByEmail(email)) {
    return { error: "An account with this email already exists." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    createUser({ email, name, passwordHash });
    return { ok: true };
  } catch {
    return { error: "Could not create the account right now." };
  }
}
