"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InvoiceStorageNote from "@/components/invoice-storage-note";
import { useInvoiceAccessStatus } from "@/hooks/use-invoice-access-status";
import {
  getProfileDefaultInvoiceSlug,
  getProfileInvoiceLabel,
  type BusinessProfile,
} from "@/lib/business-profile";
import { getSavedInvoices, getTrashedInvoices } from "@/lib/invoices";
import { invoiceUi } from "@/lib/invoice-ui";
import { getInvoiceServiceCategories } from "@/lib/service-categories";

type InvoiceCard = {
  title: string;
  description: string;
  href: string;
  key: string;
  group?: string;
};

const HIDDEN_SECTION_KEY = "unified-steele-hidden-invoice-sections";
const OPTIONAL_VISIBLE_SECTION_KEY = "unified-steele-visible-optional-invoice-sections";

const invoiceTypes: InvoiceCard[] = [
  ...getInvoiceServiceCategories().map((category) => ({
    title: `${category.name} Invoices`,
    description: category.description,
    href: `/invoices/${category.slug}`,
    key: category.slug,
    group: category.group,
  })),
  {
    title: "Saved",
    description: "View and manage all saved invoices.",
    href: "/invoices/saved",
    key: "saved",
  },
  {
    title: "Trash",
    description: "View deleted invoices. Automatically clears after 30 days.",
    href: "/invoices/trash",
    key: "trash",
  },
];

export default function InvoicesPage() {
  const [savedCount, setSavedCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [optionalVisibleSections, setOptionalVisibleSections] = useState<string[]>([]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { status } = useInvoiceAccessStatus();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSavedCount(getSavedInvoices().length);
      setTrashCount(getTrashedInvoices().length);

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

  const defaultInvoiceSlug = getProfileDefaultInvoiceSlug(businessProfile);
  const defaultInvoiceLabel = getProfileInvoiceLabel(businessProfile);
  const lockedSectionKeys = useMemo(
    () => [defaultInvoiceSlug, "saved", "trash"],
    [defaultInvoiceSlug]
  );
  const visibleInvoiceTypes = useMemo(() => {
    const optionalSections = invoiceTypes.filter(
      (type) =>
        optionalVisibleSections.includes(type.key) &&
        !hiddenSections.includes(type.key) &&
        !lockedSectionKeys.includes(type.key)
    );
    const lockedSections = lockedSectionKeys
      .map((key) => invoiceTypes.find((type) => type.key === key))
      .filter((type): type is InvoiceCard => Boolean(type));

    return [...lockedSections, ...optionalSections];
  }, [hiddenSections, lockedSectionKeys, optionalVisibleSections]);
  const customizeInvoiceTypes = useMemo(
    () =>
      invoiceTypes.filter(
        (type) =>
          type.group &&
          !visibleInvoiceTypes.some((visibleType) => visibleType.key === type.key)
      ),
    [visibleInvoiceTypes]
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
            <p className="text-[var(--color-text-secondary)]">Loading invoice center...</p>
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
                Invoices
              </p>
              <h1 className="mt-2 text-4xl font-bold">Invoice Center</h1>
              <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
                Create invoices for your default service, manage saved records,
                and restore optional sections only when you need them.
              </p>
              <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">
                Defaulting to {defaultInvoiceLabel} based on your business profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/invoices/${defaultInvoiceSlug}`} className="us-btn-primary">
                Create {defaultInvoiceLabel} Invoice
              </Link>
              <Link href="/" className={invoiceUi.navLink}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        {status && !status.hasCoreAccess ? (
          <section className="mt-6 rounded-[1.75rem] border border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.1)] p-7 shadow-[var(--shadow-card)]">
            <p className="text-sm text-[var(--color-primary)]">Invoice Access</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
              Invoice access locked
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Start your trial or subscribe to save invoices.
            </p>
            <Link href="/subscribe" className="us-btn-primary mt-4 px-4 py-2">
              Upgrade Now
            </Link>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-2xl font-bold">Invoice Sections</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleInvoiceTypes.map((type) => (
              <InvoiceSectionCard
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
                Add optional invoice sections without changing your default industry.
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
            customizeInvoiceTypes.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                Every optional invoice section is already visible.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {customizeInvoiceTypes.map((type) => (
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

        <InvoiceStorageNote className="mt-8" />
      </div>
    </main>
  );
}

type InvoiceSectionCardProps = {
  type: InvoiceCard;
  canHide: boolean;
  savedCount: number;
  trashCount: number;
  onHide: (key: string) => void;
};

function InvoiceSectionCard({
  type,
  canHide,
  savedCount,
  trashCount,
  onHide,
}: InvoiceSectionCardProps) {
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
