"use client";

import { useState, type FormEvent } from "react";

export default function ContactRequestForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
      {submitted ? (
        <div className="rounded-xl border border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.1)] px-4 py-3 text-sm font-bold text-[var(--color-success)]">
          Thanks. We&apos;ll review your request and get back to you as soon as
          possible.
        </div>
      ) : null}

      <label htmlFor="name" className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
        Name
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          className="us-input"
          placeholder="Name"
          required
        />
      </label>

      <label
        htmlFor="organization"
        className="grid gap-2 text-sm font-bold text-[var(--color-text)]"
      >
        Business
        <input
          id="organization"
          name="organization"
          type="text"
          autoComplete="organization"
          className="us-input"
          placeholder="Business"
          required
        />
      </label>

      <label htmlFor="email" className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="us-input"
          placeholder="Email"
          required
        />
      </label>

      <label htmlFor="tel" className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
        Phone
        <input
          id="tel"
          name="tel"
          type="tel"
          autoComplete="tel"
          className="us-input"
          placeholder="Phone"
        />
      </label>

      <label htmlFor="message" className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
        What can we help with?
        <textarea
          id="message"
          name="message"
          autoComplete="off"
          className="us-textarea"
          placeholder="Tell us about your goals, timeline, and services needed."
        />
      </label>

      <button type="submit" className="us-btn-primary mt-2">
        Send Request
      </button>

      <p className="text-xs leading-5 text-[var(--color-text-muted)]">
        We&apos;ll review your request and get back to you as soon as possible.
      </p>
    </form>
  );
}
