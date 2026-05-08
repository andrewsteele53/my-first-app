"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAccountRole } from "@/lib/roles";

export type SalesLeadActionResult = {
  ok: boolean;
  message: string;
};

const SAAS_LEAD_STATUSES = ["new", "contacted", "follow_up", "demo_scheduled", "signed_up", "not_interested"] as const;
const WEBSITE_LEAD_STATUSES = ["website_lead_submitted", "admin_reviewing", "admin_contacted", "website_sold", "not_interested"] as const;
const SALES_LEAD_STATUSES = [...SAAS_LEAD_STATUSES, ...WEBSITE_LEAD_STATUSES] as const;
type SalesLeadStatus = (typeof SALES_LEAD_STATUSES)[number];
type LeadType = "saas" | "website_creation";

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

function cleanLeadType(value: FormDataEntryValue | null): LeadType {
  const leadType = clean(value);
  return leadType === "website_creation" ? "website_creation" : "saas";
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
    .select("id, user_id, active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!salesRep) {
    throw new Error("No active sales rep record exists for your account.");
  }

  return { supabase, user };
}

function leadPayload(formData: FormData) {
  const businessName = clean(formData.get("business_name"));
  if (!businessName) {
    throw new Error("Business name is required.");
  }

  return {
    business_name: businessName,
    owner_name: optional(clean(formData.get("owner_name"))),
    phone: optional(clean(formData.get("phone"))),
    email: optional(clean(formData.get("email"))),
    address: optional(clean(formData.get("address"))),
    city: optional(clean(formData.get("city"))),
    state: optional(clean(formData.get("state"))),
    industry: optional(clean(formData.get("industry"))),
    service_type: optional(clean(formData.get("service_type"))),
    notes: optional(clean(formData.get("notes"))),
  };
}

function websiteLeadPayload(formData: FormData) {
  const businessName = clean(formData.get("business_name"));
  if (!businessName) {
    throw new Error("Business name is required.");
  }

  return {
    business_name: businessName,
    owner_name: optional(clean(formData.get("owner_name"))),
    phone: optional(clean(formData.get("phone"))),
    email: optional(clean(formData.get("email"))),
    address: optional(clean(formData.get("address"))),
    city: optional(clean(formData.get("city"))),
    state: optional(clean(formData.get("state"))),
    industry: optional(clean(formData.get("industry"))),
    website_url: optional(clean(formData.get("website_url"))),
    has_existing_website: clean(formData.get("has_existing_website")) === "yes",
    website_lead_notes: optional(clean(formData.get("website_lead_notes"))),
    notes: optional(clean(formData.get("notes"))),
  };
}

export async function createSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();
  const leadType = cleanLeadType(formData.get("lead_type"));
  const isWebsiteLead = leadType === "website_creation";

  const { error } = await supabase.from("sales_leads").insert({
    ...(isWebsiteLead ? websiteLeadPayload(formData) : leadPayload(formData)),
    sales_rep_id: user.id,
    created_by: user.id,
    assigned_to: isWebsiteLead ? null : user.id,
    lead_type: leadType,
    status: isWebsiteLead ? "website_lead_submitted" : "new",
    signed_up: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success(isWebsiteLead ? "Website lead submitted to admin for review." : "Lead added.");
}

export async function updateSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();
  const leadId = clean(formData.get("lead_id"));
  if (!leadId) {
    throw new Error("Choose a lead to update.");
  }

  const status = cleanStatus(formData.get("status") || "new");
  if (!SAAS_LEAD_STATUSES.includes(status as (typeof SAAS_LEAD_STATUSES)[number])) {
    throw new Error("Sales reps can only update SaaS lead statuses.");
  }

  const { error } = await supabase
    .from("sales_leads")
    .update({
      ...leadPayload(formData),
      status,
      signed_up: status === "signed_up",
      signed_up_at: status === "signed_up" ? new Date().toISOString() : null,
    })
    .eq("id", leadId)
    .eq("lead_type", "saas")
    .or(`sales_rep_id.eq.${user.id},created_by.eq.${user.id},assigned_to.eq.${user.id}`);

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
    .eq("lead_type", "saas")
    .eq("created_by", user.id);

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
  if (!SAAS_LEAD_STATUSES.includes(status as (typeof SAAS_LEAD_STATUSES)[number])) {
    throw new Error("Sales reps can only update SaaS lead statuses.");
  }

  if (!leadId) {
    throw new Error("Choose a lead to update.");
  }

  const { error } = await supabase
    .from("sales_leads")
    .update({
      status,
      signed_up: status === "signed_up",
      signed_up_at: status === "signed_up" ? new Date().toISOString() : null,
    })
    .eq("id", leadId)
    .eq("lead_type", "saas")
    .or(`sales_rep_id.eq.${user.id},created_by.eq.${user.id},assigned_to.eq.${user.id}`);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success(status === "signed_up" ? "Lead marked signed up." : "Lead status updated.");
}
