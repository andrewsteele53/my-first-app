"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INDUSTRY_GROUPS,
  getTemplateSlugForIndustry,
  normalizeIndustry,
  type BusinessProfile,
  type BusinessProfileInput,
} from "@/lib/business-profile";
import { getInvoiceServiceCategories, getQuoteServiceCategories } from "@/lib/service-categories";

type Props = {
  initialProfile?: BusinessProfile | null;
  mode: "onboarding" | "settings";
};

function profileValue(value?: string | null) {
  return value || "";
}

export default function BusinessProfileForm({ initialProfile, mode }: Props) {
  const router = useRouter();
  const normalizedInitialIndustry = normalizeIndustry(initialProfile?.industry);
  const initialCustomIndustry =
    profileValue(initialProfile?.custom_industry) ||
    (normalizedInitialIndustry === "Other" &&
    initialProfile?.industry &&
    initialProfile.industry !== "Other"
      ? initialProfile.industry
      : "");
  const [businessName, setBusinessName] = useState(profileValue(initialProfile?.business_name));
  const [ownerName, setOwnerName] = useState(profileValue(initialProfile?.owner_name));
  const [industry, setIndustry] = useState(normalizedInitialIndustry);
  const [customIndustry, setCustomIndustry] = useState(initialCustomIndustry);
  const [servicesOffered, setServicesOffered] = useState(
    profileValue(initialProfile?.services_offered)
  );
  const [defaultQuoteType, setDefaultQuoteType] = useState(
    profileValue(initialProfile?.default_quote_type) ||
      getTemplateSlugForIndustry(normalizedInitialIndustry)
  );
  const [defaultInvoiceType, setDefaultInvoiceType] = useState(
    profileValue(initialProfile?.default_invoice_type) ||
      getTemplateSlugForIndustry(normalizedInitialIndustry)
  );
  const [businessPhone, setBusinessPhone] = useState(
    profileValue(initialProfile?.business_phone)
  );
  const [businessEmail, setBusinessEmail] = useState(
    profileValue(initialProfile?.business_email)
  );
  const [businessLogoUrl, setBusinessLogoUrl] = useState(
    profileValue(initialProfile?.business_logo_url)
  );
  const [saving, setSaving] = useState(false);
  const [quoteTypeTouched, setQuoteTypeTouched] = useState(false);
  const [invoiceTypeTouched, setInvoiceTypeTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const quoteCategories = useMemo(() => getQuoteServiceCategories(), []);
  const invoiceCategories = useMemo(() => getInvoiceServiceCategories(), []);

  function handleIndustryChange(value: string) {
    const normalized = normalizeIndustry(value);
    setIndustry(normalized);

    if (normalized !== "Other") {
      setCustomIndustry("");
    }

    const suggested = getTemplateSlugForIndustry(normalized);
    if (mode === "onboarding" || !quoteTypeTouched) {
      setDefaultQuoteType(suggested);
    }

    if (mode === "onboarding" || !invoiceTypeTouched) {
      setDefaultInvoiceType(suggested);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    if (!industry.trim()) {
      setError("Industry is required.");
      return;
    }

    if (industry === "Other" && !customIndustry.trim()) {
      setError("Tell us your industry so Unified Steele can personalize your setup.");
      return;
    }

    const payload: BusinessProfileInput = {
      business_name: businessName,
      owner_name: ownerName,
      industry,
      custom_industry: customIndustry,
      services_offered: servicesOffered,
      default_quote_type: defaultQuoteType,
      default_invoice_type: defaultInvoiceType,
      business_phone: businessPhone,
      business_email: businessEmail,
      business_logo_url: businessLogoUrl,
      onboarding_completed: true,
    };

    try {
      setSaving(true);
      const response = await fetch("/api/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not save business profile.");
      }

      if (mode === "onboarding") {
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("Business profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save business profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Business Name" required>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            className="us-input"
            placeholder="Steele Roofing Co."
          />
        </Field>

        <Field label="Owner Name">
          <input
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            className="us-input"
            placeholder="Andrew Steele"
          />
        </Field>

        {mode === "settings" ? (
          <Field label="Industry" required>
            <select
              value={industry}
              onChange={(event) => handleIndustryChange(event.target.value)}
              className="us-input"
            >
              <option value="">Choose your industry</option>
              {INDUSTRY_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((option) => (
                    <option key={option.name} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        ) : null}

        <Field label="Services Offered">
          <input
            value={servicesOffered}
            onChange={(event) => setServicesOffered(event.target.value)}
            className="us-input"
            placeholder="Repairs, installs, inspections"
          />
        </Field>

        <Field label="Default Quote Type">
          <select
            value={defaultQuoteType}
            onChange={(event) => {
              setQuoteTypeTouched(true);
              setDefaultQuoteType(event.target.value);
            }}
            className="us-input"
          >
            {quoteCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Default Invoice Type">
          <select
            value={defaultInvoiceType}
            onChange={(event) => {
              setInvoiceTypeTouched(true);
              setDefaultInvoiceType(event.target.value);
            }}
            className="us-input"
          >
            {invoiceCategories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Business Phone">
          <input
            value={businessPhone}
            onChange={(event) => setBusinessPhone(event.target.value)}
            className="us-input"
            placeholder="555-555-5555"
          />
        </Field>

        <Field label="Business Email">
          <input
            type="email"
            value={businessEmail}
            onChange={(event) => setBusinessEmail(event.target.value)}
            className="us-input"
            placeholder="office@example.com"
          />
        </Field>

        <Field label="Business Logo URL">
          <input
            value={businessLogoUrl}
            onChange={(event) => setBusinessLogoUrl(event.target.value)}
            className="us-input"
            placeholder="https://example.com/logo.png"
          />
        </Field>
      </div>

      {mode === "onboarding" ? (
        <section>
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Choose your industry <span className="text-[var(--color-danger)]">*</span>
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Unified Steele will personalize your dashboard, quote defaults, invoice
              defaults, and AI context from this choice.
            </p>
          </div>
          <div className="space-y-5">
            {INDUSTRY_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                  {group.group}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.options.map((option) => {
                    const selected = industry === option.name;
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => handleIndustryChange(option.name)}
                        className={`min-h-32 rounded-[1.2rem] border p-4 text-left shadow-[var(--shadow-card-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] ${
                          selected
                            ? "border-[var(--color-primary)] bg-[rgba(47,93,138,0.1)] ring-2 ring-[rgba(47,93,138,0.16)]"
                            : "border-[var(--color-border)] bg-white"
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold ${
                              selected
                                ? "border-[rgba(47,93,138,0.28)] bg-white text-[var(--color-primary)]"
                                : "border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] text-[var(--color-primary)]"
                            }`}
                          >
                            {option.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-base font-bold text-[var(--color-text)]">
                              {option.name}
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-[var(--color-text-secondary)]">
                              {option.helper}
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {industry === "Other" ? (
        <Field label="Custom Industry" required>
          <input
            value={customIndustry}
            onChange={(event) => setCustomIndustry(event.target.value)}
            className="us-input"
            placeholder="Tell us what kind of service business you run"
          />
        </Field>
      ) : null}

      {error ? <div className="us-notice-danger text-sm">{error}</div> : null}
      {message ? <div className="us-notice-success text-sm">{message}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            saving ||
            (mode === "onboarding" && !industry) ||
            (industry === "Other" && !customIndustry.trim())
          }
          className="us-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : mode === "onboarding"
            ? "Save and Open Dashboard"
            : "Save Business Profile"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[var(--color-text)]">
        {label} {required ? <span className="text-[var(--color-danger)]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
