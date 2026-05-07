"use client";

import { useState } from "react";

export default function WebsiteQuoteForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]"
      onSubmit={async (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const requiredFields = [
          "name",
          "businessName",
          "email",
          "phone",
          "package",
        ];
        const missingField = requiredFields.some((field) => {
          const value = formData.get(field);
          return typeof value !== "string" || value.trim().length === 0;
        });

        if (missingField) {
          setSubmitted(false);
          setError("Please complete the required fields before submitting.");
          return;
        }

        setIsSubmitting(true);
        setError("");

        const response = await fetch("/api/website-preview-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: String(formData.get("name") || ""),
            businessName: String(formData.get("businessName") || ""),
            email: String(formData.get("email") || ""),
            phone: String(formData.get("phone") || ""),
            industry: String(formData.get("industry") || ""),
            currentWebsiteUrl: String(formData.get("currentWebsiteUrl") || ""),
            businessProfileUrl: String(formData.get("businessProfileUrl") || ""),
            servicesOffered: String(formData.get("servicesOffered") || ""),
            preferredColorsStyle: String(formData.get("preferredColorsStyle") || ""),
            websitesTheyLike: String(formData.get("websitesTheyLike") || ""),
            packageInterested: String(formData.get("package") || ""),
            message: String(formData.get("message") || ""),
          }),
        });

        const result = await response.json().catch(() => null);
        setIsSubmitting(false);

        if (!response.ok) {
          setSubmitted(false);
          setError(result?.error || "We could not submit your request right now. Please try again.");
          return;
        }

        event.currentTarget.reset();
        setSubmitted(true);
      }}
    >
      <div className="mb-6">
        <p className="us-kicker">Request Your Free Website Preview</p>
        <h3 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
          Request Your Free Website Preview
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Tell us about your business and we&apos;ll create a website preview.
          If you like it, we&apos;ll send secure Stripe payment options to move
          forward.
        </p>
      </div>

      {submitted ? (
        <div className="mb-5 rounded-xl border border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.1)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
          Your website preview request has been submitted. We&apos;ll review
          your business and send preview screenshots by email.
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-xl border border-[rgba(199,80,80,0.22)] bg-[rgba(199,80,80,0.1)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["name", "Name", "text"],
          ["businessName", "Business Name", "text"],
          ["email", "Email", "email"],
          ["phone", "Phone", "tel"],
          ["industry", "Industry", "text"],
        ].map(([name, label, type]) => (
          <label key={name} className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
            {label}{["name", "businessName", "email", "phone"].includes(name) ? " *" : ""}
            <input
              name={name}
              type={type}
              className="us-input"
              required={["name", "businessName", "email", "phone"].includes(name)}
            />
          </label>
        ))}

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
          Current website URL, if any
          <input name="currentWebsiteUrl" type="url" className="us-input" placeholder="https://example.com" />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
          Facebook/business profile link, if any
          <input name="businessProfileUrl" type="url" className="us-input" placeholder="https://facebook.com/yourbusiness" />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
          Services or products offered
          <textarea
            name="servicesOffered"
            className="us-textarea min-h-28"
            placeholder="List your services, products, packages, or specialties."
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
          Preferred colors/style
          <input name="preferredColorsStyle" type="text" className="us-input" placeholder="Modern, clean, black and white, bold, calm..." />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
          Websites you like
          <input name="websitesTheyLike" type="text" className="us-input" placeholder="Paste links or describe styles you like." />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
          Package interested in *
          <select name="package" className="us-input" defaultValue="" required>
            <option value="" disabled>
              Select a package
            </option>
            <option>Professional Website — $499.99 one-time</option>
            <option>Professional Website + Management — $249.99 setup + $59.99/month</option>
            <option>Custom Website</option>
            <option>Not sure yet</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
          Message / project details
          <textarea
            name="message"
            className="us-textarea"
            placeholder="Tell us about pages, goals, timeline, features, or anything we should know before creating your preview."
          />
        </label>
      </div>

      <button type="submit" className="us-btn-primary mt-5 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Request Free Preview"}
      </button>
    </form>
  );
}
