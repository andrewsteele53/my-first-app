"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await requireAdmin(supabase, user);

  if (!user) {
    throw new Error("Unauthorized.");
  }

  return { supabase, user };
}

export async function addSalesRepAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const userId = clean(formData.get("user_id"));
  const displayName = clean(formData.get("display_name"));
  const paymentNotes = clean(formData.get("payment_notes"));

  if (!userId) {
    throw new Error("Choose a user to add as a sales rep.");
  }

  const { data: profile, error: readProfileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, business_name, owner_name")
    .eq("id", userId)
    .maybeSingle();

  if (readProfileError) {
    throw new Error(readProfileError.message);
  }

  if (!profile) {
    throw new Error("Profile not found.");
  }

  const fallbackDisplayName =
    (typeof profile.display_name === "string" && profile.display_name.trim()) ||
    (typeof profile.business_name === "string" && profile.business_name.trim()) ||
    (typeof profile.owner_name === "string" && profile.owner_name.trim()) ||
    (typeof profile.email === "string" && profile.email.trim()) ||
    "Sales Rep";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "sales" })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error } = await supabase.from("sales_reps").upsert(
    {
      user_id: userId,
      display_name: displayName || fallbackDisplayName,
      payment_notes: paymentNotes || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
}

export async function assignSubscriberAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const subscriberUserId = clean(formData.get("subscriber_user_id"));
  const salesRepId = clean(formData.get("sales_rep_id"));

  if (!subscriberUserId) {
    throw new Error("Subscriber is required.");
  }

  if (!salesRepId) {
    const { error } = await supabase
      .from("sales_assignments")
      .delete()
      .eq("subscriber_user_id", subscriberUserId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("sales_assignments").upsert(
      {
        subscriber_user_id: subscriberUserId,
        sales_rep_id: salesRepId,
        assigned_by: user.id,
      },
      { onConflict: "subscriber_user_id" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
}

export async function markCurrentCommissionPaidAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const salesRepId = clean(formData.get("sales_rep_id"));
  const amount = Number(clean(formData.get("amount")));
  const notes = clean(formData.get("notes"));

  if (!salesRepId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("A positive payout amount is required.");
  }

  const { error } = await supabase.from("commission_payouts").insert({
    sales_rep_id: salesRepId,
    amount,
    status: "paid",
    paid_at: new Date().toISOString(),
    notes: notes || "Manual commission payout recorded from admin dashboard.",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
}

export async function markPayoutPaidAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const payoutId = clean(formData.get("payout_id"));

  if (!payoutId) {
    throw new Error("Payout is required.");
  }

  const { error } = await supabase
    .from("commission_payouts")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payoutId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
}
