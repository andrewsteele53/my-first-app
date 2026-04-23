"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const RECOVERY_FLAG_KEY = "unified-steele-password-recovery";

function hasRecoveryType() {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return (
    searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery"
  );
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    async function checkRecoverySession() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const recoveryHint = hasRecoveryType();
      const hasStoredRecoveryFlag =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(RECOVERY_FLAG_KEY) === "true";
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session && (recoveryHint || hasStoredRecoveryFlag)) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(RECOVERY_FLAG_KEY, "true");
        }
        setRecoveryReady(true);
      } else {
        setRecoveryReady(false);
      }

      setLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        if (event === "PASSWORD_RECOVERY" && session) {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(RECOVERY_FLAG_KEY, "true");
          }
          setRecoveryReady(true);
          setLoading(false);
          setError("");
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    }

    void checkRecoverySession();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!recoveryReady) {
      setError("Your recovery session is not ready. Please use the reset link from your email.");
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RECOVERY_FLAG_KEY);
      }

      setSuccess("Password updated successfully. Redirecting to login...");

      window.setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset password."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="us-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
        <p className="us-kicker">
          Unified Steele
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--color-text)]">
          Reset Password
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Set a new password for your account once your recovery session is confirmed.
        </p>

        {loading ? (
          <div className="us-subtle-card mt-8 text-sm text-[var(--color-text-secondary)]">
            Checking your reset session...
          </div>
        ) : recoveryReady ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[var(--color-text)]"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="us-input"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-[var(--color-text)]"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="us-input"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="us-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        ) : (
          <div className="us-notice-warning mt-8 text-sm">
            This reset link is invalid or has expired. Request a new password reset email to continue.
            <div className="mt-3">
              <Link
                href="/forgot-password"
                className="us-link"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        )}

        {success ? (
          <div className="us-notice-success mt-4 text-sm">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="us-notice-danger mt-4 text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          <Link
            href="/login"
            className="us-link"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
