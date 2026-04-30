"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        setError(signupError.message);
        return;
      }

      setSuccess("Account created. Check your email to confirm your account.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-white p-9 shadow-[var(--shadow-card)]">
        <p className="us-kicker text-center">Unified Steele</p>
        <h1 className="mt-4 text-center text-3xl font-extrabold text-[var(--color-text)]">
          Start your free trial in under 30 seconds.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[var(--color-text-secondary)]">
          Create your account and start organizing invoices, leads, jobs, and
          follow-ups from one dashboard.
        </p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="us-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            className="us-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="us-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Start Free Trial"}
          </button>
        </form>

        {success ? (
          <div className="us-notice-success mt-4 text-sm">{success}</div>
        ) : null}

        {error ? (
          <div className="us-notice-danger mt-4 text-sm">{error}</div>
        ) : null}

        <p className="mt-5 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
          30-day free trial. Cancel anytime.
        </p>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="us-link">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
