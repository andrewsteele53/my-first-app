"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/roles";

export type AdminActionResult = {
  ok: boolean;
  message: string;
};

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanRole(value: FormDataEntryValue | null) {
  const role = clean(value);
  if (role === "admin" || role === "sales" || role === "subscriber") {
    return role;
  }

  throw new Error("Choose a valid role.");
}

function success(message: string): AdminActionResult {
  return { ok: true, message };
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
      active: true,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success("Sales rep saved.");
}

export async function updateUserAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const userId = clean(formData.get("user_id"));
  const displayName = clean(formData.get("display_name"));
  const role = cleanRole(formData.get("role"));
  const paymentNotes = clean(formData.get("payment_notes"));

  if (!userId) {
    throw new Error("User is required.");
  }

  if (userId === user.id && role !== "admin") {
    const confirmed = clean(formData.get("confirm_self_demote"));
    if (confirmed !== "yes") {
      throw new Error("Confirm before changing your own admin role.");
    }
  }

  const { data: profile, error: readProfileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (readProfileError) {
    throw new Error(readProfileError.message);
  }

  if (!profile) {
    throw new Error("Profile not found.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      role,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (role === "sales") {
    const fallbackDisplayName =
      displayName ||
      (typeof profile.display_name === "string" && profile.display_name.trim()) ||
      (typeof profile.email === "string" && profile.email.trim()) ||
      "Sales Rep";

    const { error: repError } = await supabase.from("sales_reps").upsert(
      {
        user_id: userId,
        display_name: fallbackDisplayName,
        payment_notes: paymentNotes || null,
        active: true,
      },
      { onConflict: "user_id" }
    );

    if (repError) {
      throw new Error(repError.message);
    }
  }

  if (role === "subscriber") {
    await deactivateSalesRepForUser(supabase, userId);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success("User updated.");
}

export async function setUserRoleAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const userId = clean(formData.get("user_id"));
  const role = cleanRole(formData.get("role"));

  if (!userId) {
    throw new Error("User is required.");
  }

  if (userId === user.id && role !== "admin") {
    const confirmed = clean(formData.get("confirm_self_demote"));
    if (confirmed !== "yes") {
      throw new Error("Confirm before changing your own admin role.");
    }
  }

  if (role === "sales") {
    return addSalesRepAction(formData);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (role === "subscriber") {
    await deactivateSalesRepForUser(supabase, userId);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success(role === "admin" ? "User promoted to admin." : "User changed to subscriber.");
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
    const { data: rep, error: repReadError } = await supabase
      .from("sales_reps")
      .select("id, active")
      .eq("id", salesRepId)
      .maybeSingle();

    if (repReadError) {
      throw new Error(repReadError.message);
    }

    if (!rep || rep.active === false) {
      throw new Error("Choose an active sales rep.");
    }

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
  return success(salesRepId ? "Subscriber assignment saved." : "Subscriber unassigned.");
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
  return success("Current commission marked paid.");
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
  return success("Payout marked paid.");
}

export async function updateSalesRepAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const salesRepId = clean(formData.get("sales_rep_id"));
  const displayName = clean(formData.get("display_name"));
  const paymentNotes = clean(formData.get("payment_notes"));

  if (!salesRepId) {
    throw new Error("Sales rep is required.");
  }

  const { error } = await supabase
    .from("sales_reps")
    .update({
      display_name: displayName || null,
      payment_notes: paymentNotes || null,
      active: true,
    })
    .eq("id", salesRepId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success("Sales rep updated.");
}

export async function removeSalesRepAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const salesRepId = clean(formData.get("sales_rep_id"));

  if (!salesRepId) {
    throw new Error("Sales rep is required.");
  }

  const { data: rep, error: readError } = await supabase
    .from("sales_reps")
    .select("id, user_id")
    .eq("id", salesRepId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!rep) {
    throw new Error("Sales rep not found.");
  }

  const { error: assignmentError } = await supabase
    .from("sales_assignments")
    .delete()
    .eq("sales_rep_id", salesRepId);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const { error: repError } = await supabase
    .from("sales_reps")
    .update({ active: false })
    .eq("id", salesRepId);

  if (repError) {
    throw new Error(repError.message);
  }

  if (rep.user_id) {
    const { data: profile, error: profileReadError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", rep.user_id)
      .maybeSingle();

    if (profileReadError) {
      throw new Error(profileReadError.message);
    }

    if (profile?.role !== "admin") {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "subscriber" })
        .eq("id", rep.user_id);

      if (profileError) {
        throw new Error(profileError.message);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success("Sales rep removed. Payout history was preserved.");
}

export async function createManualPayoutAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const salesRepId = clean(formData.get("sales_rep_id"));
  const amount = Number(clean(formData.get("amount")));
  const notes = clean(formData.get("notes"));

  if (!salesRepId) {
    throw new Error("Choose a sales rep.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a positive payout amount.");
  }

  const { error } = await supabase.from("commission_payouts").insert({
    sales_rep_id: salesRepId,
    amount,
    status: "unpaid",
    notes: notes || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success("Manual payout created.");
}

async function deactivateSalesRepForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: rep, error: readError } = await supabase
    .from("sales_reps")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!rep) return;

  const { error: assignmentError } = await supabase
    .from("sales_assignments")
    .delete()
    .eq("sales_rep_id", rep.id);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const { error: repError } = await supabase
    .from("sales_reps")
    .update({ active: false })
    .eq("id", rep.id);

  if (repError) {
    throw new Error(repError.message);
  }
}
