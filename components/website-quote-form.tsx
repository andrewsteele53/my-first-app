"use client";

import { useState } from "react";

export default function WebsiteQuoteForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]"
      onSubmit={(event) => {
        event.preventDefault();
        // TODO: Capture website development leads in Supabase once the intake table is finalized.
        setSubmitted(true);
      }}
    >
      {submitted ? (
        <div className="mb-5 rounded-xl border border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.1)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
          Thanks. Your website request has been received.
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
            {label}
            <input name={name} type={type} className="us-input" required={name !== "phone"} />
          </label>
        ))}

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
          Do you currently have a website?
          <select name="hasWebsite" className="us-input" defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>Yes</option>
            <option>No</option>
            <option>Not sure</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
          Website package interested in
          <select name="package" className="us-input" defaultValue="">
            <option value="" disabled>
              Select a package
            </option>
            <option>Professional Website - $499.99 one-time</option>
            <option>Professional Website + Management - $249.99 setup + $59.99/month</option>
            <option>Custom Website - Custom Quote</option>
            <option>Not sure yet</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
          Message / project details
          <textarea
            name="message"
            className="us-textarea"
            placeholder="Tell us about pages, goals, timeline, existing website, or features you need."
          />
        </label>
      </div>

      <button type="submit" className="us-btn-primary mt-5 w-full">
        Send Website Request
      </button>
    </form>
  );
}
