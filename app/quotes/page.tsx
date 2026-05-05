"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { invoiceUi } from "@/lib/invoice-ui";
import {
  getProfileDefaultQuoteSlug,
  getProfileQuoteLabel,
  type BusinessProfile,
} from "@/lib/business-profile";
import { getSavedQuotes, getTrashedQuotes } from "@/lib/quotes";
import { getQuoteServiceCategories } from "@/lib/service-categories";

type QuoteCard = {
  title: string;
  description: string;
  href: string;
  key: string;
  group?: string;
};

const HIDDEN_SECTION_KEY = "unified-steele-hidden-quote-sections";
const OPTIONAL_VISIBLE_SECTION_KEY = "unified-steele-visible-optional-quote-sections";

const quoteTypes: QuoteCard[] = [
  ...getQuoteServiceCategories().map((category) => ({
    title: `${category.name} Quotes`,
    description: category.description,
    href: `/quotes/${category.slug}`,
    key: category.slug,
    group: category.group,
  })),
  {
    title: "Saved",
    description: "Review quote statuses and convert approved quotes to invoices.",
    href: "/quotes/saved",
    key: "saved",
  },
  {
    title: "Trash",
    description: "Restore or permanently delete trashed quotes.",
    href: "/quotes/trash",
    key: "trash",
  },
];

export default function QuotesPage() {
  const [savedCount, setSavedCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [optionalVisibleSections, setOptionalVisibleSections] = useState<string[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
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

      const optionalVisibleRaw = localStorage.getItem(OPTIONAL_VISIBLE_SECTION_KEY);
      if (optionalVisibleRaw) {
        try {
          const parsed = JSON.parse(optionalVisibleRaw);
          if (Array.isArray(parsed)) {
            setOptionalVisibleSections(parsed);
          }
        } catch {
          setOptionalVisibleSections([]);
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

  function updateOptionalVisibleSections(next: string[]) {
    setOptionalVisibleSections(next);
    localStorage.setItem(OPTIONAL_VISIBLE_SECTION_KEY, JSON.stringify(next));
  }

  const defaultQuoteSlug = getProfileDefaultQuoteSlug(businessProfile);
  const defaultQuoteLabel = getProfileQuoteLabel(businessProfile);
  const lockedSectionKeys = useMemo(
    () => [defaultQuoteSlug, "saved", "trash"],
    [defaultQuoteSlug]
  );
  const visibleQuoteTypes = useMemo(() => {
    const optionalSections = quoteTypes.filter(
      (type) =>
        optionalVisibleSections.includes(type.key) &&
        !hiddenSections.includes(type.key) &&
        !lockedSectionKeys.includes(type.key)
    );
    const lockedSections = lockedSectionKeys
      .map((key) => quoteTypes.find((type) => type.key === key))
      .filter((type): type is QuoteCard => Boolean(type));

    return [...lockedSections, ...optionalSections];
  }, [hiddenSections, lockedSectionKeys, optionalVisibleSections]);
  const customizeQuoteTypes = useMemo(
    () =>
      quoteTypes.filter(
        (type) =>
          type.group &&
          !visibleQuoteTypes.some((visibleType) => visibleType.key === type.key)
      ),
    [visibleQuoteTypes]
  );

  function hideOptionalSection(key: string) {
    if (lockedSectionKeys.includes(key)) return;

    updateOptionalVisibleSections(optionalVisibleSections.filter((item) => item !== key));
    updateHiddenSections([...new Set([...hiddenSections, key])]);
  }

  function showOptionalSection(key: string) {
    if (lockedSectionKeys.includes(key)) return;

    updateOptionalVisibleSections([...new Set([...optionalVisibleSections, key])]);
    updateHiddenSections(hiddenSections.filter((item) => item !== key));
  }

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
                approved quotes into invoices when the job is ready. Add optional
                sections only when your business needs them.
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

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Quote Sections</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleQuoteTypes.map((type) => (
              <QuoteSectionCard
                key={type.key}
                type={type}
                canHide={!lockedSectionKeys.includes(type.key)}
                savedCount={savedCount}
                trashCount={trashCount}
                onHide={hideOptionalSection}
              />
            ))}
          </div>
        </section>

        <section className={`mt-8 ${invoiceUi.card}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Customize Sections</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Add optional quote sections without changing your default industry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomizeOpen((current) => !current)}
              className="us-btn-secondary"
            >
              {customizeOpen ? "Close Customize" : "Customize Sections"}
            </button>
          </div>

          {customizeOpen ? (
            customizeQuoteTypes.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                Every optional quote section is already visible.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {customizeQuoteTypes.map((type) => (
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
                      onClick={() => showOptionalSection(type.key)}
                      className="us-btn-primary mt-4 px-3 py-2 text-sm"
                    >
                      Unhide
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </section>
      </div>
    </main>
  );
}

type QuoteSectionCardProps = {
  type: QuoteCard;
  canHide: boolean;
  savedCount: number;
  trashCount: number;
  onHide: (key: string) => void;
};

function QuoteSectionCard({
  type,
  canHide,
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

        {canHide ? (
          <button
            type="button"
            onClick={() => onHide(type.key)}
            className="us-btn-primary px-3 py-2 text-sm"
          >
            Hide
          </button>
        ) : null}
      </div>

      <Link href={type.href} className="us-link mt-6 inline-block text-sm">
        Open section -&gt;
      </Link>
    </div>
  );
}
