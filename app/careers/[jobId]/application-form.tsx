"use client";

import { useState, useTransition } from "react";
import { submitJobApplicationAction, type CareerActionResult } from "../actions";

export default function JobApplicationForm({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CareerActionResult | null>(null);

  function submit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const actionResult = await submitJobApplicationAction(formData);
      setResult(actionResult);
    });
  }

  return (
    <form action={submit} className="us-card space-y-4">
      <input type="hidden" name="job_listing_id" value={jobId} />
      <div>
        <p className="us-kicker">Application</p>
        <h2 className="mt-2 text-2xl font-extrabold">Apply for this position</h2>
      </div>

      {result ? (
        <div className={result.ok ? "us-notice-success text-sm" : "us-notice-danger text-sm"}>
          {result.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">
          Full name
          <input name="full_name" className="us-input" required disabled={isPending || result?.ok} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Email
          <input name="email" type="email" className="us-input" required disabled={isPending || result?.ok} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Phone
          <input name="phone" className="us-input" disabled={isPending || result?.ok} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Location
          <input name="location" className="us-input" disabled={isPending || result?.ok} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Availability
          <input name="availability" className="us-input" disabled={isPending || result?.ok} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Preferred contact method
          <input name="preferred_contact_method" className="us-input" placeholder="Email, phone, text" disabled={isPending || result?.ok} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-bold">
        Experience summary
        <textarea name="experience_summary" className="us-textarea" disabled={isPending || result?.ok} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Why are you interested?
        <textarea name="why_interested" className="us-textarea" disabled={isPending || result?.ok} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Resume link
        <input name="resume_link" className="us-input" placeholder="Optional URL" disabled={isPending || result?.ok} />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Notes
        <textarea name="notes" className="us-textarea" disabled={isPending || result?.ok} />
      </label>

      <button type="submit" className="us-btn-primary w-full sm:w-auto" disabled={isPending || result?.ok}>
        {isPending ? "Submitting..." : result?.ok ? "Application Submitted" : "Submit Application"}
      </button>
    </form>
  );
}
