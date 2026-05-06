"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAccountRole } from "@/lib/roles";

export type SalesLeadActionResult = {
  ok: boolean;
  message: string;
};

const SALES_LEAD_STATUSES = [
  "new",
  "contacted",
  "follow_up",
  "interested",
  "not_interested",
  "subscribed",
  "lost",
] as const;

type SalesLeadStatus = (typeof SALES_LEAD_STATUSES)[number];

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value || null;
}

function cleanStatus(value: FormDataEntryValue | null): SalesLeadStatus {
  const status = clean(value);
  if (SALES_LEAD_STATUSES.includes(status as SalesLeadStatus)) {
    return status as SalesLeadStatus;
  }

  throw new Error("Choose a valid lead status.");
}

function cleanOptionalUuid(value: FormDataEntryValue | null) {
  const id = clean(value);
  return id || null;
}

function success(message: string): SalesLeadActionResult {
  return { ok: true, message };
}

async function requireSalesRepContext() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await requireAccountRole(supabase, user, ["sales", "admin"]);

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const { data: salesRep, error } = await supabase
    .from("sales_reps")
    .select("id, user_id, display_name, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!salesRep) {
    throw new Error("No active sales rep record exists for your account.");
  }

  return { supabase, user, salesRep };
}

function leadPayload(formData: FormData) {
  const businessName = clean(formData.get("business_name"));
  if (!businessName) {
    throw new Error("Business name is required.");
  }

  const status = cleanStatus(formData.get("status") || "new");
  const subscribedProfileId = cleanOptionalUuid(formData.get("subscribed_profile_id"));

  return {
    business_name: businessName,
    contact_name: optional(clean(formData.get("contact_name"))),
    phone: optional(clean(formData.get("phone"))),
    email: optional(clean(formData.get("email"))),
    address: optional(clean(formData.get("address"))),
    industry: optional(clean(formData.get("industry"))),
    status,
    notes: optional(clean(formData.get("notes"))),
    follow_up_date: optional(clean(formData.get("follow_up_date"))),
    subscribed_profile_id: status === "subscribed" ? subscribedProfileId : null,
    subscribed_at: status === "subscribed" ? new Date().toISOString() : null,
  };
}

export async function createSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user, salesRep } = await requireSalesRepContext();
  const payload = leadPayload(formData);

  const { error } = await supabase.from("sales_leads").insert({
    ...payload,
    sales_rep_id: salesRep.id,
    sales_rep_user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success("Lead added.");
}

export async function updateSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();
  const leadId = clean(formData.get("lead_id"));
  if (!leadId) {
    throw new Error("Choose a lead to update.");
  }

  const { error } = await supabase
    .from("sales_leads")
    .update(leadPayload(formData))
    .eq("id", leadId)
    .eq("sales_rep_user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success("Lead updated.");
}

export async function deleteSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();
  const leadId = clean(formData.get("lead_id"));
  if (!leadId) {
    throw new Error("Choose a lead to delete.");
  }

  const { error } = await supabase
    .from("sales_leads")
    .delete()
    .eq("id", leadId)
    .eq("sales_rep_user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success("Lead deleted.");
}

export async function updateSalesLeadStatusAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();
  const leadId = clean(formData.get("lead_id"));
  const status = cleanStatus(formData.get("status"));
  const subscribedProfileId = cleanOptionalUuid(formData.get("subscribed_profile_id"));

  if (!leadId) {
    throw new Error("Choose a lead to update.");
  }

  const { error } = await supabase
    .from("sales_leads")
    .update({
      status,
      subscribed_profile_id: status === "subscribed" ? subscribedProfileId : null,
      subscribed_at: status === "subscribed" ? new Date().toISOString() : null,
    })
    .eq("id", leadId)
    .eq("sales_rep_user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success(status === "subscribed" ? "Lead marked subscribed." : "Lead status updated.");
}
