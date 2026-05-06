"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CareerActionResult = {
  ok: boolean;
  message: string;
};

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function submitJobApplicationAction(
  formData: FormData
): Promise<CareerActionResult> {
  const supabase = await createClient();
  const jobListingId = clean(formData.get("job_listing_id"));
  const fullName = clean(formData.get("full_name"));
  const email = clean(formData.get("email")).toLowerCase();
  const phone = clean(formData.get("phone"));
  const location = clean(formData.get("location"));
  const experienceSummary = clean(formData.get("experience_summary"));
  const whyInterested = clean(formData.get("why_interested"));
  const availability = clean(formData.get("availability"));
  const preferredContactMethod = clean(formData.get("preferred_contact_method"));
  const resumeLink = clean(formData.get("resume_link"));
  const notes = clean(formData.get("notes"));

  if (!jobListingId) {
    return { ok: false, message: "Choose a job before applying." };
  }

  if (!fullName || !email) {
    return { ok: false, message: "Name and email are required." };
  }

  const { data: job, error: jobError } = await supabase
    .from("job_listings")
    .select("id")
    .eq("id", jobListingId)
    .eq("status", "published")
    .maybeSingle();

  if (jobError) {
    return { ok: false, message: jobError.message };
  }

  if (!job) {
    return { ok: false, message: "This position is no longer accepting applications." };
  }

  const { error } = await supabase.from("job_applications").insert({
    job_listing_id: jobListingId,
    full_name: fullName,
    email,
    phone: phone || null,
    location: location || null,
    experience_summary: experienceSummary || null,
    why_interested: whyInterested || null,
    availability: availability || null,
    preferred_contact_method: preferredContactMethod || null,
    resume_link: resumeLink || null,
    notes: notes || null,
    status: "new",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: "Application submitted. We'll review it and reach out if there's a fit.",
  };
}
