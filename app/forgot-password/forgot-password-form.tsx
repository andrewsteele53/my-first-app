"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess("Check your email for reset link");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to send reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
        <p className="us-kicker">Unified Steele</p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--color-text)]">
          Forgot Password
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Enter your email and we&apos;ll send you a secure link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[var(--color-text)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="us-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="us-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending Reset Link..." : "Send Reset Link"}
          </button>
        </form>

        {success ? (
          <div className="us-notice-success mt-4 text-sm">{success}</div>
        ) : null}

        {error ? <div className="us-notice-danger mt-4 text-sm">{error}</div> : null}

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          <Link href="/login" className="us-link">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
