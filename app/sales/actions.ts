"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { requireAccountRole } from "@/lib/roles";

export type SalesLeadActionResult = {
  ok: boolean;
  message: string;
};

const SALES_LEAD_STATUSES = ["new", "contacted", "interested", "signed_up"] as const;
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
  };
}

export async function createSalesLeadAction(formData: FormData): Promise<SalesLeadActionResult> {
  const { supabase, user } = await requireSalesRepContext();

  const { error } = await supabase.from("sales_leads").insert({
    ...leadPayload(formData),
    sales_rep_id: user.id,
    status: "new",
    signed_up: false,
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

  const status = cleanStatus(formData.get("status") || "new");
  const { error } = await supabase
    .from("sales_leads")
    .update({
      ...leadPayload(formData),
      status,
      signed_up: status === "signed_up",
      signed_up_at: status === "signed_up" ? new Date().toISOString() : null,
    })
    .eq("id", leadId)
    .eq("sales_rep_id", user.id);

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
    .eq("sales_rep_id", user.id);

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
    .eq("sales_rep_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/sales");
  revalidatePath("/admin");
  return success(status === "signed_up" ? "Lead marked signed up." : "Lead status updated.");
}
