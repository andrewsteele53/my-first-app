"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import { createTeamAccountAction } from "./actions";

export default function TeamSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string; loginLink?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const data = new FormData();
    data.set("email", email);
    data.set("password", password);

    startTransition(async () => {
      const result = await createTeamAccountAction(data);
      setMessage({ ok: result.ok, text: result.message, loginLink: result.loginLink });

      if (result.ok) {
        setPassword("");
      }
    });
  }

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg rounded-[1.8rem] border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-9">
        <div className="text-center">
          <p className="us-kicker">Unified Steele</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Unified Steele Team Signup
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            This page is only for approved Unified Steele team members and sales reps.
            Create your account using the same email address you were approved with.
          </p>
        </div>

        <div className="mt-6 rounded-[1.1rem] border border-[rgba(183,121,31,0.22)] bg-[rgba(183,121,31,0.08)] px-4 py-3 text-sm font-semibold leading-6 text-[var(--color-warning)]">
          If your email has not been approved by the admin, this form will not create team access.
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
            Approved email
            <input
              type="email"
              autoComplete="email"
              className="us-input"
              placeholder="you@example.com"
              value={email}
              disabled={isPending || message?.ok}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
            Password
            <input
              type="password"
              autoComplete="new-password"
              className="us-input"
              placeholder="Create a password"
              value={password}
              disabled={isPending || message?.ok}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={isPending || Boolean(message?.ok)}
            className="us-btn-primary w-full px-5 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating Account..." : "Create Team Account"}
          </button>
        </form>

        {message ? (
          <div className={message.ok ? "us-notice-success mt-4 text-sm" : "us-notice-danger mt-4 text-sm"}>
            <p>{message.text}</p>
            {message.loginLink ? (
              <Link href="/login" className="us-btn-secondary mt-3 w-full px-4 py-2 text-sm">
                Log in
              </Link>
            ) : null}
          </div>
        ) : null}

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Already created your account?{" "}
          <Link href="/login" className="us-link">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
