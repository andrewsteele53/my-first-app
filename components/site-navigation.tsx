import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

type SiteNavigationProps = {
  featuresHref?: string;
  pricingHref?: string;
};

export default function SiteNavigation({
  featuresHref = "/#features",
  pricingHref = "/#pricing",
}: SiteNavigationProps) {
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Features", href: featuresHref },
    { label: "Pricing", href: pricingHref },
    { label: "Website Development", href: "/website-development" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-3">
          <BrandLogo size="sm" showTagline={false} />
        </Link>

        <div className="hidden items-center gap-1 rounded-2xl border border-[var(--color-border-muted)] bg-white/80 p-1 shadow-[var(--shadow-card-soft)] lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary-active)]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="us-btn-secondary min-h-11 px-5 text-sm">
            Log In
          </Link>
          <Link href="/auth/signup" className="us-btn-primary min-h-11 px-5 text-sm">
            Start Free Trial
          </Link>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 list-none items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-xl font-bold shadow-[var(--shadow-card-soft)] marker:hidden">
            <span className="group-open:hidden">=</span>
            <span className="hidden group-open:inline">x</span>
          </summary>
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--shadow-card)]">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 grid gap-2 border-t border-[var(--color-border-muted)] pt-3">
              <Link href="/auth/signup" className="us-btn-primary w-full text-sm">
                Start Free Trial
              </Link>
              <Link href="/login" className="us-btn-secondary w-full text-sm">
                Log In
              </Link>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
