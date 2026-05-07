"use client";

import type { WebsiteCheckoutType } from "@/lib/website-stripe";
import { useWebsiteCheckout } from "@/hooks/use-website-checkout";

type WebsiteCheckoutButtonProps = {
  type: WebsiteCheckoutType;
  children: React.ReactNode;
  className?: string;
};

export default function WebsiteCheckoutButton({
  type,
  children,
  className = "us-btn-secondary w-full text-sm",
}: WebsiteCheckoutButtonProps) {
  const { error, isLoading, startCheckout } = useWebsiteCheckout();

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className}
        disabled={isLoading}
        onClick={() => startCheckout(type)}
      >
        {isLoading ? "Redirecting..." : children}
      </button>
      {error ? (
        <p className="text-xs font-semibold leading-5 text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
