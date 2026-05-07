import Link from "next/link";
import BrandLogo from "@/components/brand-logo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border-muted)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <BrandLogo size="md" />
        <div className="flex flex-wrap gap-4 text-sm font-bold text-[var(--color-text-secondary)]">
          <Link href="/" className="transition hover:text-[var(--color-primary-active)]">
            Home
          </Link>
          <Link href="/website-development" className="transition hover:text-[var(--color-primary-active)]">
            Website Development
          </Link>
          <Link href="/contact" className="transition hover:text-[var(--color-primary-active)]">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
