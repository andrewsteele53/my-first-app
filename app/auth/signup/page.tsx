"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          router.replace("/");
          return;
        }
      } catch {
        // Ignore session check failures and allow manual sign up.
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess("Check your email to confirm your account");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-white p-7 shadow-[var(--shadow-card)] sm:p-9">
        <div className="text-center">
          <p className="us-kicker">Unified Steele</p>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
            Start your free trial in under 30 seconds.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            Create your account and start organizing invoices, leads, jobs, and
            follow-ups from one dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="us-input"
              placeholder="you@example.com"
              disabled={loading || checkingSession}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[var(--color-text)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="us-input"
              placeholder="Create a password"
              disabled={loading || checkingSession}
            />
          </div>

          <button
            type="submit"
            disabled={loading || checkingSession}
            className="us-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkingSession ? "Checking..." : loading ? "Creating Account..." : "Start Free Trial"}
          </button>
        </form>

        {error ? (
          <div className="us-notice-danger mt-4 text-sm">{error}</div>
        ) : null}

        {success ? (
          <div className="us-notice-success mt-4 text-sm">{success}</div>
        ) : null}

        <p className="mt-5 text-center text-sm font-semibold text-[var(--color-text-secondary)]">
          30-day free trial. Cancel anytime.
        </p>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="us-link"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
