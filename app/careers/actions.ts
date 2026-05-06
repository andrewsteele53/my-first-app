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

function safeFileName(name: string) {
  const baseName = name.replace(/\.pdf$/i, "");
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeBase || "resume"}.pdf`;
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
  const resumeFile = formData.get("resume_file");
  const notes = clean(formData.get("notes"));
  let resumeFilePath: string | null = null;

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

  if (resumeFile instanceof File && resumeFile.size > 0) {
    const isPdf =
      resumeFile.name.toLowerCase().endsWith(".pdf") &&
      (!resumeFile.type || resumeFile.type === "application/pdf");
    const maxSize = 5 * 1024 * 1024;

    if (!isPdf) {
      return { ok: false, message: "Please upload a PDF resume." };
    }

    if (resumeFile.size > maxSize) {
      return { ok: false, message: "Resume PDF must be 5MB or smaller." };
    }

    resumeFilePath = `job-applications/${jobListingId}/${Date.now()}-${safeFileName(resumeFile.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(resumeFilePath, resumeFile, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return { ok: false, message: uploadError.message };
    }
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
    resume_file_path: resumeFilePath,
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
