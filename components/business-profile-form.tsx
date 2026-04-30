"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INDUSTRY_OPTIONS,
  getTemplateSlugForIndustry,
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
  const [businessName, setBusinessName] = useState(profileValue(initialProfile?.business_name));
  const [ownerName, setOwnerName] = useState(profileValue(initialProfile?.owner_name));
  const [industry, setIndustry] = useState(profileValue(initialProfile?.industry));
  const [servicesOffered, setServicesOffered] = useState(
    profileValue(initialProfile?.services_offered)
  );
  const [defaultQuoteType, setDefaultQuoteType] = useState(
    profileValue(initialProfile?.default_quote_type) ||
      getTemplateSlugForIndustry(initialProfile?.industry)
  );
  const [defaultInvoiceType, setDefaultInvoiceType] = useState(
    profileValue(initialProfile?.default_invoice_type) ||
      getTemplateSlugForIndustry(initialProfile?.industry)
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const quoteCategories = useMemo(() => getQuoteServiceCategories(), []);
  const invoiceCategories = useMemo(() => getInvoiceServiceCategories(), []);

  function handleIndustryChange(value: string) {
    setIndustry(value);
    const suggested = getTemplateSlugForIndustry(value);
    setDefaultQuoteType(suggested);
    setDefaultInvoiceType(suggested);
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

    const payload: BusinessProfileInput = {
      business_name: businessName,
      owner_name: ownerName,
      industry,
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

        <Field label="Industry" required>
          <select
            value={industry}
            onChange={(event) => handleIndustryChange(event.target.value)}
            className="us-input"
          >
            <option value="">Choose your industry</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

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
            onChange={(event) => setDefaultQuoteType(event.target.value)}
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
            onChange={(event) => setDefaultInvoiceType(event.target.value)}
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

      {error ? <div className="us-notice-danger text-sm">{error}</div> : null}
      {message ? <div className="us-notice-success text-sm">{message}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
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
