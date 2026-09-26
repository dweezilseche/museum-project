"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";

import { useMuseum } from "@/components/MuseumProvider";
import { registerUser } from "@/app/actions/auth";

// Full-screen connection / registration overlay, styled like the Information
// dialog. Login uses Auth.js `signIn` with `redirect: false` so we stay in the
// modal; registration creates the account server-side then signs in.
export default function AuthDialog() {
  const { authOpen, setAuthOpen } = useMuseum();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  // Reset transient state as we close (called from every close path), which
  // avoids a synchronous setState inside an effect.
  const close = useCallback(() => {
    setMode("login");
    setError(null);
    setPending(false);
    setAuthOpen(false);
  }, [setAuthOpen]);

  useEffect(() => {
    if (!authOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen, close]);

  if (!authOpen) return null;

  const isRegister = mode === "register";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegister) {
        const result = await registerUser(undefined, formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          isRegister
            ? "Account created, but sign-in failed."
            : "Incorrect email or password.",
        );
        return;
      }

      close();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-label={isRegister ? "Sign up" : "Sign in"}
      className="animate-fade-in fixed inset-0 z-[70] overflow-y-auto bg-background px-6 py-8 md:px-16 md:py-14"
    >
      <button
        type="button"
        onClick={close}
        className="nav-link fixed right-6 top-8 z-10 md:right-16 md:top-14"
      >
        Close
      </button>

      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
        <div className="mb-10 flex items-baseline gap-6">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={
              !isRegister
                ? "text-foreground underline underline-offset-4"
                : "nav-link"
            }
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={
              isRegister
                ? "text-foreground underline underline-offset-4"
                : "nav-link"
            }
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {isRegister && (
            <label className="flex flex-col gap-2">
              <span className="text-muted">Name</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                className="border-0 border-b border-foreground/20 bg-transparent pb-1 outline-none focus:border-foreground"
              />
            </label>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-muted">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="border-0 border-b border-foreground/20 bg-transparent pb-1 outline-none focus:border-foreground"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-muted">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="border-0 border-b border-foreground/20 bg-transparent pb-1 outline-none focus:border-foreground"
            />
          </label>

          {error && <p className="text-muted">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="nav-link mt-2 self-start disabled:opacity-40"
          >
            {pending ? "…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
