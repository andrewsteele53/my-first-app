"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  WEBSITE_BUILDER_CTA_GOALS,
  WEBSITE_BUILDER_INDUSTRIES,
  WEBSITE_BUILDER_STYLES,
  generateWebsiteDraft,
  generateWebsitePrompt,
  type WebsiteBuilderFormData,
  type WebsiteDraft,
} from "@/lib/ai/website-builder";

const initialFormData: WebsiteBuilderFormData = {
  businessName: "Summit Ridge Roofing",
  industry: "Roofing",
  serviceArea: "Nashville, TN",
  phone: "(555) 214-9012",
  email: "info@summitridgeroofing.com",
  currentWebsiteUrl: "",
  facebookPageUrl: "",
  mainServices: "Roof inspections, storm damage repair, roof replacement, leak repair",
  aboutBusiness: "A locally owned roofing company helping homeowners protect their property with honest inspections and dependable workmanship.",
  preferredStyle: "Rugged Contractor",
  brandColors: "Charcoal, white, steel blue",
  testimonials: "",
  specialOffers: "Free roof inspection for local homeowners",
  ctaGoal: "Schedule Estimate",
};

function updateField(
  formData: WebsiteBuilderFormData,
  key: keyof WebsiteBuilderFormData,
  value: string
) {
  return { ...formData, [key]: value };
}

export default function AdminWebsiteBuilderClient() {
  const [formData, setFormData] = useState<WebsiteBuilderFormData>(initialFormData);
  const [draft, setDraft] = useState<WebsiteDraft>(() => generateWebsiteDraft(initialFormData));
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const prompt = useMemo(() => generateWebsitePrompt(formData), [formData]);

  function generateDraft() {
    setDraft(generateWebsiteDraft(formData));
    setGeneratedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
        <div className="flex flex-col gap-2 border-b border-[var(--color-border-muted)] pb-4">
          <p className="us-kicker">Builder Inputs</p>
          <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Website generation form</h2>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Add the business details, generate a draft, then refine the preview before saving or publishing is added later.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextInput label="Business Name" value={formData.businessName} onChange={(value) => setFormData(updateField(formData, "businessName", value))} />
          <SelectInput label="Industry" value={formData.industry} options={WEBSITE_BUILDER_INDUSTRIES} onChange={(value) => setFormData(updateField(formData, "industry", value))} />
          <TextInput label="Service Area / City" value={formData.serviceArea} onChange={(value) => setFormData(updateField(formData, "serviceArea", value))} />
          <TextInput label="Phone Number" value={formData.phone} onChange={(value) => setFormData(updateField(formData, "phone", value))} />
          <TextInput label="Email" type="email" value={formData.email} onChange={(value) => setFormData(updateField(formData, "email", value))} />
          <TextInput label="Current Website URL optional" value={formData.currentWebsiteUrl} onChange={(value) => setFormData(updateField(formData, "currentWebsiteUrl", value))} />
          <TextInput label="Facebook Page URL optional" value={formData.facebookPageUrl} onChange={(value) => setFormData(updateField(formData, "facebookPageUrl", value))} />
          <SelectInput label="Preferred Style" value={formData.preferredStyle} options={WEBSITE_BUILDER_STYLES} onChange={(value) => setFormData(updateField(formData, "preferredStyle", value))} />
          <TextInput label="Brand Colors optional" value={formData.brandColors} onChange={(value) => setFormData(updateField(formData, "brandColors", value))} />
          <SelectInput label="Call-To-Action Goal" value={formData.ctaGoal} options={WEBSITE_BUILDER_CTA_GOALS} onChange={(value) => setFormData(updateField(formData, "ctaGoal", value))} />
          <TextareaInput label="Main Services" value={formData.mainServices} onChange={(value) => setFormData(updateField(formData, "mainServices", value))} />
          <TextareaInput label="About the Business" value={formData.aboutBusiness} onChange={(value) => setFormData(updateField(formData, "aboutBusiness", value))} />
          <TextareaInput label="Testimonials optional" value={formData.testimonials} onChange={(value) => setFormData(updateField(formData, "testimonials", value))} />
          <TextareaInput label="Special Offers optional" value={formData.specialOffers} onChange={(value) => setFormData(updateField(formData, "specialOffers", value))} />
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <UploadPlaceholder title="Upload Logo" text="Logo upload will be connected later for saved website projects." />
          <UploadPlaceholder title="Upload Images" text="Project photos, team images, and background media will be attached here later." />
        </div>

        <button type="button" className="us-btn-primary mt-5 w-full py-3 text-sm" onClick={generateDraft}>
          Generate Website Draft
        </button>

        <details className="mt-5 rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-[var(--color-text)]">
            AI prompt structure
          </summary>
          <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[var(--color-text-secondary)]">{prompt}</pre>
        </details>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="us-kicker">Live Draft Preview</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--color-text)]">Generated website preview</h2>
          </div>
          {generatedAt ? (
            <span className="inline-flex rounded-full border border-[var(--color-border-muted)] bg-[var(--color-section)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
              Generated {generatedAt}
            </span>
          ) : null}
        </div>
        <WebsitePreview formData={formData} draft={draft} />
      </section>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
      {label}
      <input className="us-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
      {label}
      <select className="us-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
      {label}
      <textarea className="us-textarea min-h-28" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function UploadPlaceholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-section)] p-4">
      <p className="text-sm font-extrabold text-[var(--color-text)]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{text}</p>
    </div>
  );
}

function WebsitePreview({
  formData,
  draft,
}: {
  formData: WebsiteBuilderFormData;
  draft: WebsiteDraft;
}) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-[var(--color-border)] bg-[#f8fafc]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-300" />
          <span className="h-3 w-3 rounded-full bg-amber-300" />
          <span className="h-3 w-3 rounded-full bg-emerald-300" />
        </div>
        <p className="text-xs font-bold text-slate-500">{formData.businessName || "Website Draft"}</p>
      </div>

      <div className="bg-slate-950 text-white">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-black">{formData.businessName || "Service Business"}</p>
          <button type="button" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950">
            {draft.primaryCta}
          </button>
        </div>
        <div className="px-5 pb-12 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
            {formData.industry} in {formData.serviceArea || "your area"}
          </p>
          <h3 className="mt-4 max-w-2xl text-4xl font-black leading-tight">{draft.headline}</h3>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200">{draft.subheadline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950">
              {draft.primaryCta}
            </button>
            <span className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold">
              {formData.phone || "Call today"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <PreviewSection title={draft.aboutTitle}>
          <p className="text-sm leading-6 text-slate-600">{draft.aboutBody}</p>
        </PreviewSection>

        <PreviewSection title="Services">
          <div className="grid gap-3 sm:grid-cols-2">
            {draft.services.map((service) => (
              <div key={service} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="font-black text-slate-900">{service}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Clear scope, dependable scheduling, and a simple path from request to completed work.
                </p>
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Why Choose Us">
          <div className="grid gap-2">
            {draft.whyChooseUs.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <span className="text-emerald-700">OK</span>
                {item}
              </div>
            ))}
          </div>
        </PreviewSection>

        <PreviewSection title="Testimonials">
          <div className="grid gap-3">
            {draft.testimonials.map((testimonial) => (
              <blockquote key={testimonial} className="rounded-xl border border-slate-200 bg-white p-4 text-sm italic leading-6 text-slate-600">
                &quot;{testimonial}&quot;
              </blockquote>
            ))}
          </div>
        </PreviewSection>

        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Ready to start?</p>
          <h3 className="mt-2 text-2xl font-black">{draft.offer}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-200">{draft.contactLine}</p>
          <button type="button" className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950">
            {draft.primaryCta}
          </button>
        </div>

        <PreviewSection title="Contact">
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewContact label="Phone" value={formData.phone || "Not provided"} />
            <PreviewContact label="Email" value={formData.email || "Not provided"} />
            <PreviewContact label="Service Area" value={formData.serviceArea || "Not provided"} />
            <PreviewContact label="Facebook" value={formData.facebookPageUrl || "Not provided"} />
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PreviewContact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
