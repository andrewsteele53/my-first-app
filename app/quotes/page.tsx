"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { invoiceUi } from "@/lib/invoice-ui";
import {
  getProfileDefaultQuoteSlug,
  getProfileIndustryLabel,
  getProfileQuoteLabel,
  type BusinessProfile,
} from "@/lib/business-profile";
import { getSavedQuotes, getTrashedQuotes } from "@/lib/quotes";
import { getQuoteServiceCategories, SERVICE_CATEGORY_GROUPS } from "@/lib/service-categories";

type QuoteCard = {
  title: string;
  description: string;
  href: string;
  key: string;
  group?: string;
};

const HIDDEN_SECTION_KEY = "unified-steele-hidden-quote-sections";

const quoteTypes: QuoteCard[] = [
  ...getQuoteServiceCategories().map((category) => ({
    title: `${category.name} Quote`,
    description: category.description,
    href: `/quotes/${category.slug}`,
    key: category.slug,
    group: category.group,
  })),
  {
    title: "Saved Quotes",
    description: "Review quote statuses and convert approved quotes to invoices.",
    href: "/quotes/saved",
    key: "saved",
  },
  {
    title: "Quote Trash",
    description: "Restore or permanently delete trashed quotes.",
    href: "/quotes/trash",
    key: "trash",
  },
];

export default function QuotesPage() {
  const [savedCount, setSavedCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedCount(getSavedQuotes().length);
      setTrashCount(getTrashedQuotes().length);

      const hiddenRaw = localStorage.getItem(HIDDEN_SECTION_KEY);
      if (hiddenRaw) {
        try {
          const parsed = JSON.parse(hiddenRaw);
          if (Array.isArray(parsed)) {
            setHiddenSections(parsed);
          }
        } catch {
          setHiddenSections([]);
        }
      }

      fetch("/api/business-profile")
        .then((response) => response.json())
        .then((data) => {
          if (data.profile) {
            setBusinessProfile(data.profile);
          }
        })
        .catch(() => {
          setBusinessProfile(null);
        })
        .finally(() => {
          setLoaded(true);
        });

    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function updateHiddenSections(next: string[]) {
    setHiddenSections(next);
    localStorage.setItem(HIDDEN_SECTION_KEY, JSON.stringify(next));
  }

  const defaultQuoteSlug = getProfileDefaultQuoteSlug(businessProfile);
  const defaultQuoteLabel = getProfileQuoteLabel(businessProfile);
  const industryLabel = getProfileIndustryLabel(businessProfile);

  const visibleQuoteTypes = useMemo(
    () => quoteTypes.filter((type) => !hiddenSections.includes(type.key)),
    [hiddenSections]
  );

  const hiddenQuoteTypes = useMemo(
    () => quoteTypes.filter((type) => hiddenSections.includes(type.key)),
    [hiddenSections]
  );

  const visibleServiceGroups = useMemo(
    () =>
      SERVICE_CATEGORY_GROUPS.map((group) => ({
        group,
        items: visibleQuoteTypes.filter((type) => type.group === group),
      })).filter((section) => section.items.length > 0),
    [visibleQuoteTypes]
  );

  const visibleUtilityTypes = useMemo(
    () => visibleQuoteTypes.filter((type) => !type.group),
    [visibleQuoteTypes]
  );

  if (!loaded) {
    return (
      <main className={invoiceUi.page}>
        <div className={invoiceUi.container}>
          <section className={invoiceUi.heroCard}>
            <p className="text-[var(--color-text-secondary)]">Loading quote center...</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <section className={invoiceUi.heroCard}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Quotes
              </p>
              <h1 className="mt-2 text-4xl font-bold">Quote Center</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Create estimates and proposals before work is approved, then convert
                approved quotes into invoices when the job is ready. Hide sections
                you do not want showing on this device.
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">
                Defaulting to {defaultQuoteLabel} based on your business profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/quotes/${defaultQuoteSlug}`} className="us-btn-primary">
                Create {defaultQuoteLabel} Quote
              </Link>
              <Link href="/" className={invoiceUi.navLink}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-[rgba(47,93,138,0.2)] bg-[rgba(47,93,138,0.08)] p-5 shadow-[var(--shadow-card-soft)]">
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            Business profile: {industryLabel}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            You can still open any quote type below or change your default in Settings.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Saved Quote Count</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{savedCount}</p>
          </div>
          <div className={invoiceUi.card}>
            <p className="text-sm text-[var(--color-text-secondary)]">Trash Count</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{trashCount}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Visible Sections</h2>

          {visibleQuoteTypes.length === 0 ? (
            <div className={`mt-6 ${invoiceUi.card}`}>
              <p className="text-[var(--color-text-secondary)]">
                All quote sections are hidden right now. Use the hidden section
                list below to restore them.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {visibleServiceGroups.map((section) => (
                <div key={section.group}>
                  <h3 className="text-lg font-bold text-[var(--color-text)]">
                    {section.group}
                  </h3>
                  <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {section.items.map((type) => (
                      <QuoteSectionCard
                        key={type.key}
                        type={type}
                        hiddenSections={hiddenSections}
                        savedCount={savedCount}
                        trashCount={trashCount}
                        onHide={updateHiddenSections}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {visibleUtilityTypes.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-text)]">Saved & Trash</h3>
                  <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {visibleUtilityTypes.map((type) => (
                      <QuoteSectionCard
                        key={type.key}
                        type={type}
                        hiddenSections={hiddenSections}
                        savedCount={savedCount}
                        trashCount={trashCount}
                        onHide={updateHiddenSections}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className={`mt-8 ${invoiceUi.card}`}>
          <h2 className="text-lg font-bold">Hidden Sections</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Hidden sections stay hidden on this device until you restore them.
          </p>

          {hiddenQuoteTypes.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              No quote sections are hidden right now.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {hiddenQuoteTypes.map((type) => (
                <div
                  key={type.key}
                  className="rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-5"
                >
                  <h3 className="text-lg font-semibold">{type.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {type.description}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      updateHiddenSections(hiddenSections.filter((item) => item !== type.key))
                    }
                    className="us-btn-primary mt-4 px-3 py-2 text-sm"
                  >
                    Unhide
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

type QuoteSectionCardProps = {
  type: QuoteCard;
  hiddenSections: string[];
  savedCount: number;
  trashCount: number;
  onHide: (next: string[]) => void;
};

function QuoteSectionCard({
  type,
  hiddenSections,
  savedCount,
  trashCount,
  onHide,
}: QuoteSectionCardProps) {
  const isSaved = type.key === "saved";
  const isTrash = type.key === "trash";

  return (
    <div className={invoiceUi.heroCard}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{type.title}</h2>
          {isSaved || isTrash ? (
            <p
              className={`mt-2 text-sm font-semibold ${
                isSaved ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isSaved ? `${savedCount} saved` : `${trashCount} in trash`}
            </p>
          ) : null}
          <p className="mt-3 text-[var(--color-text-secondary)]">{type.description}</p>
        </div>

        <button
          type="button"
          onClick={() => onHide([...hiddenSections, type.key])}
          className="us-btn-primary px-3 py-2 text-sm"
        >
          Hide
        </button>
      </div>

      <Link href={type.href} className="us-link mt-6 inline-block text-sm">
        Open section -&gt;
      </Link>
    </div>
  );
}
