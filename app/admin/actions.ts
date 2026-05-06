"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";
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

function cleanApplicationStatus(value: FormDataEntryValue | null) {
  const status = clean(value);
  if (status === "pending" || status === "approved" || status === "rejected") {
    return status;
  }

  throw new Error("Choose a valid application status.");
}

function cleanJobStatus(value: FormDataEntryValue | null) {
  const status = clean(value);
  if (status === "draft" || status === "published" || status === "closed") {
    return status;
  }

  throw new Error("Choose a valid job status.");
}

function cleanJobApplicationStatus(value: FormDataEntryValue | null) {
  const status = clean(value);
  if (status === "new" || status === "reviewing" || status === "interview" || status === "approved" || status === "rejected") {
    return status;
  }

  throw new Error("Choose a valid applicant status.");
}

function success(message: string): AdminActionResult {
  return { ok: true, message };
}

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

export async function makeSalesRepAction(profileId: string): Promise<AdminActionResult> {
  const { supabase } = await requireAdminContext();
  const userId = profileId.trim();

  if (!userId) {
    throw new Error("Choose a user to add as a sales rep.");
  }

  const { data: profile, error: readProfileError } = await supabase
    .from("profiles")
    .select("id, email, display_name")
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
    (typeof profile.email === "string" && profile.email.trim()) ||
    "Sales Rep";

  const { data: existingRep, error: existingRepError } = await supabase
    .from("sales_reps")
    .select("payment_notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingRepError) {
    throw new Error(existingRepError.message);
  }

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
      display_name: fallbackDisplayName,
      payment_notes: existingRep?.payment_notes || null,
      active: true,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success(`${fallbackDisplayName} is now a sales rep.`);
}

export async function syncMissingProfilesAction(): Promise<AdminActionResult> {
  await requireAdminContext();
  const serviceSupabase = createServiceRoleClient();
  const users = [];
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  if (users.length === 0) {
    return success("No auth users found to sync.");
  }

  const { data: existingProfiles, error: profilesError } = await serviceSupabase
    .from("profiles")
    .select("id");

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const existingIds = new Set(
    (existingProfiles || [])
      .map((profile) => (typeof profile.id === "string" ? profile.id : ""))
      .filter(Boolean)
  );
  const missingProfiles = users
    .filter((user) => !existingIds.has(user.id))
    .map((user) => {
      const metadata = user.user_metadata as Record<string, unknown> | null;
      const displayName =
        (typeof metadata?.display_name === "string" && metadata.display_name.trim()) ||
        (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
        user.email ||
        "New user";

      return {
        id: user.id,
        email: user.email ?? null,
        display_name: displayName,
        role: "subscriber",
        subscription_status: "inactive",
        created_at: user.created_at || new Date().toISOString(),
      };
    });

  if (missingProfiles.length > 0) {
    const { error: insertError } = await serviceSupabase
      .from("profiles")
      .insert(missingProfiles);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  revalidatePath("/admin");
  return success(
    missingProfiles.length === 1
      ? "Synced 1 missing user profile."
      : `Synced ${missingProfiles.length} missing user profiles.`
  );
}

export async function addSalesRepAction(formData: FormData) {
  const userId = clean(formData.get("user_id"));
  const displayName = clean(formData.get("display_name"));
  const paymentNotes = clean(formData.get("payment_notes"));

  if (!displayName && !paymentNotes) {
    return makeSalesRepAction(userId);
  }

  const { supabase } = await requireAdminContext();

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
    displayName ||
    (typeof profile.display_name === "string" && profile.display_name.trim()) ||
    (typeof profile.business_name === "string" && profile.business_name.trim()) ||
    (typeof profile.owner_name === "string" && profile.owner_name.trim()) ||
    (typeof profile.email === "string" && profile.email.trim()) ||
    "Sales Rep";

  const { data: existingRep, error: existingRepError } = await supabase
    .from("sales_reps")
    .select("payment_notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingRepError) {
    throw new Error(existingRepError.message);
  }

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
      display_name: fallbackDisplayName,
      payment_notes: paymentNotes || existingRep?.payment_notes || null,
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
    const { data: existingRep, error: existingRepError } = await supabase
      .from("sales_reps")
      .select("payment_notes")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRepError) {
      throw new Error(existingRepError.message);
    }

    const fallbackDisplayName =
      displayName ||
      (typeof profile.display_name === "string" && profile.display_name.trim()) ||
      (typeof profile.email === "string" && profile.email.trim()) ||
      "Sales Rep";

    const { error: repError } = await supabase.from("sales_reps").upsert(
      {
        user_id: userId,
        display_name: fallbackDisplayName,
        payment_notes: paymentNotes || existingRep?.payment_notes || null,
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
    return makeSalesRepAction(userId);
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

export async function createTeamApplicationAction(formData: FormData) {
  try {
    const { supabase } = await requireAdminContext();
    const name = clean(formData.get("name"));
    const email = clean(formData.get("email")).toLowerCase();
    const phone = clean(formData.get("phone"));
    const desiredRole = clean(formData.get("desired_role")) || "sales";
    const notes = clean(formData.get("notes"));

    if (!email) {
      return { ok: false, message: "Email is required." };
    }

    const { error } = await supabase.from("team_applications").insert({
      name: name || null,
      email,
      phone: phone || null,
      desired_role: desiredRole,
      status: "pending",
      notes: notes || null,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/admin");
    return success("Pending team member added.");
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to add pending team member.",
    };
  }
}

export async function updateTeamApplicationAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));
  const name = clean(formData.get("name"));
  const email = clean(formData.get("email")).toLowerCase();
  const phone = clean(formData.get("phone"));
  const desiredRole = clean(formData.get("desired_role")) || "sales";
  const status = cleanApplicationStatus(formData.get("status"));
  const notes = clean(formData.get("notes"));
  const reviewedFields =
    status === "approved" || status === "rejected"
      ? { reviewed_at: new Date().toISOString(), reviewed_by: user.id }
      : { reviewed_at: null, reviewed_by: null };

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  if (!email) {
    throw new Error("Email is required.");
  }

  const { error } = await supabase
    .from("team_applications")
    .update({
      name: name || null,
      email,
      phone: phone || null,
      desired_role: desiredRole,
      status,
      notes: notes || null,
      ...reviewedFields,
    })
    .eq("id", applicationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return success("Team application updated.");
}

export async function rejectTeamApplicationAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { error } = await supabase
    .from("team_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", applicationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return success("Team application rejected.");
}

export async function approveTeamApplicationAsSalesAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { data: application, error: applicationError } = await supabase
    .from("team_applications")
    .select("id, name, email, notes")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  if (!application) {
    throw new Error("Application not found.");
  }

  const email = typeof application.email === "string" ? application.email.trim().toLowerCase() : "";

  if (!email) {
    throw new Error("Application email is required.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: applicationUpdateError } = await supabase
    .from("team_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", applicationId);

  if (applicationUpdateError) {
    throw new Error(applicationUpdateError.message);
  }

  if (!profile) {
    revalidatePath("/admin");
    return success("Approved, but this person still needs to create an account with this email.");
  }

  const displayName =
    (typeof application.name === "string" && application.name.trim()) ||
    (typeof profile.display_name === "string" && profile.display_name.trim()) ||
    (typeof profile.email === "string" && profile.email.trim()) ||
    email;

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "sales" })
    .eq("id", profile.id);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const { error: repError } = await supabase.from("sales_reps").upsert(
    {
      user_id: profile.id,
      display_name: displayName,
      payment_notes:
        typeof application.notes === "string" && application.notes.trim()
          ? application.notes.trim()
          : null,
      active: true,
    },
    { onConflict: "user_id" }
  );

  if (repError) {
    throw new Error(repError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success(`${displayName} was approved and added as a sales rep.`);
}

export async function deleteTeamApplicationAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { error } = await supabase
    .from("team_applications")
    .delete()
    .eq("id", applicationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return success("Team application deleted.");
}

export async function createJobListingAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const title = clean(formData.get("title"));

  if (!title) {
    return { ok: false, message: "Job title is required." };
  }

  const { error } = await supabase.from("job_listings").insert({
    title,
    department: clean(formData.get("department")) || null,
    location: clean(formData.get("location")) || null,
    employment_type: clean(formData.get("employment_type")) || null,
    compensation: clean(formData.get("compensation")) || null,
    description: clean(formData.get("description")) || null,
    requirements: clean(formData.get("requirements")) || null,
    status: cleanJobStatus(formData.get("status")),
    created_by: user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/careers");
  return success("Job listing created.");
}

export async function updateJobListingAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const jobId = clean(formData.get("job_id"));
  const title = clean(formData.get("title"));

  if (!jobId) {
    throw new Error("Job listing is required.");
  }

  if (!title) {
    return { ok: false, message: "Job title is required." };
  }

  const { error } = await supabase
    .from("job_listings")
    .update({
      title,
      department: clean(formData.get("department")) || null,
      location: clean(formData.get("location")) || null,
      employment_type: clean(formData.get("employment_type")) || null,
      compensation: clean(formData.get("compensation")) || null,
      description: clean(formData.get("description")) || null,
      requirements: clean(formData.get("requirements")) || null,
      status: cleanJobStatus(formData.get("status")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/careers");
  revalidatePath(`/careers/${jobId}`);
  return success("Job listing updated.");
}

export async function setJobListingStatusAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const jobId = clean(formData.get("job_id"));
  const status = cleanJobStatus(formData.get("status"));

  if (!jobId) {
    throw new Error("Job listing is required.");
  }

  const { error } = await supabase
    .from("job_listings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/careers");
  revalidatePath(`/careers/${jobId}`);
  return success(`Job listing set to ${status}.`);
}

export async function deleteJobListingAction(formData: FormData) {
  const { supabase } = await requireAdminContext();
  const jobId = clean(formData.get("job_id"));

  if (!jobId) {
    throw new Error("Job listing is required.");
  }

  const { error } = await supabase.from("job_listings").delete().eq("id", jobId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/careers");
  return success("Job listing deleted.");
}

export async function updateJobApplicationAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));
  const status = cleanJobApplicationStatus(formData.get("status"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { error } = await supabase
    .from("job_applications")
    .update({
      status,
      notes: clean(formData.get("notes")) || null,
      reviewed_at: status === "new" ? null : new Date().toISOString(),
      reviewed_by: status === "new" ? null : user.id,
    })
    .eq("id", applicationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  return success("Job application updated.");
}

export async function approveJobApplicationAsPendingTeamMemberAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { data: application, error: readError } = await supabase
    .from("job_applications")
    .select("id, full_name, email, phone, notes")
    .eq("id", applicationId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!application) {
    throw new Error("Application not found.");
  }

  const { error: insertError } = await supabase.from("team_applications").insert({
    name: application.full_name || null,
    email: application.email,
    phone: application.phone || null,
    desired_role: "sales",
    status: "pending",
    notes: application.notes || "Created from job application.",
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("job_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", applicationId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin");
  return success("Applicant approved as a pending team member.");
}

export async function approveJobApplicationAsSalesRepAction(formData: FormData) {
  const { supabase, user } = await requireAdminContext();
  const applicationId = clean(formData.get("application_id"));

  if (!applicationId) {
    throw new Error("Application is required.");
  }

  const { data: application, error: readError } = await supabase
    .from("job_applications")
    .select("id, full_name, email, notes")
    .eq("id", applicationId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!application) {
    throw new Error("Application not found.");
  }

  const email = typeof application.email === "string" ? application.email.trim().toLowerCase() : "";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: applicationError } = await supabase
    .from("job_applications")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", applicationId);

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  if (!profile) {
    revalidatePath("/admin");
    return success("Applicant approved, but they still need to create an account with this email.");
  }

  const displayName =
    (typeof application.full_name === "string" && application.full_name.trim()) ||
    (typeof profile.display_name === "string" && profile.display_name.trim()) ||
    (typeof profile.email === "string" && profile.email.trim()) ||
    email;

  const { error: roleError } = await supabase
    .from("profiles")
    .update({ role: "sales" })
    .eq("id", profile.id);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const { error: repError } = await supabase.from("sales_reps").upsert(
    {
      user_id: profile.id,
      display_name: displayName,
      payment_notes:
        typeof application.notes === "string" && application.notes.trim()
          ? application.notes.trim()
          : null,
      active: true,
    },
    { onConflict: "user_id" }
  );

  if (repError) {
    throw new Error(repError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/sales");
  return success(`${displayName} was approved and added as a sales rep.`);
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
