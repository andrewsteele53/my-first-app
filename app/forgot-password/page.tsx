import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const ForgotPasswordForm = dynamic(() => import("./forgot-password-form"), {
  ssr: false,
  loading: () => (
    <main className="us-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.8rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]">
        <p className="us-kicker">Unified Steele</p>
        <h1 className="mt-4 text-3xl font-bold text-[var(--color-text)]">
          Forgot Password
        </h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          Loading reset form...
        </p>
      </div>
    </main>
  ),
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
