"use server";

import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";

export type TeamSignupResult = {
  ok: boolean;
  message: string;
};

type TeamApplication = {
  id: string;
  name: string | null;
  email: string;
  notes: string | null;
  status: string | null;
};

function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Team signup is not configured yet.");
  }

  return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isExistingAccountError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists");
}

function userFacingCreateUserError(message: string) {
  if (isExistingAccountError(message)) {
    return "You already have an account. Please log in instead.";
  }

  if (message.toLowerCase().includes("database error creating new user")) {
    return "We could not create your team account yet. Please contact the admin to finish setup.";
  }

  return message;
}

async function activateTeamAccount({
  supabase,
  application,
  userId,
  email,
  displayName,
}: {
  supabase: ReturnType<typeof createServiceRoleClient>;
  application: TeamApplication;
  userId: string;
  email: string;
  displayName: string;
}) {
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      display_name: displayName,
      role: "sales",
      subscription_status: "inactive",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: existingRep, error: existingRepError } = await supabase
    .from("sales_reps")
    .select("payment_notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingRepError) {
    throw new Error(existingRepError.message);
  }

  const { error: repError } = await supabase.from("sales_reps").upsert(
    {
      user_id: userId,
      display_name: displayName,
      payment_notes: existingRep?.payment_notes || application.notes || null,
      active: true,
    },
    { onConflict: "user_id" }
  );

  if (repError) {
    throw new Error(repError.message);
  }

  const { error: applicationError } = await supabase
    .from("team_applications")
    .update({ status: "active" })
    .eq("id", application.id);

  if (applicationError) {
    throw new Error(applicationError.message);
  }
}

export async function createTeamAccountAction(formData: FormData): Promise<TeamSignupResult> {
  try {
    const email = clean(formData.get("email")).toLowerCase();
    const password = clean(formData.get("password"));

    if (!email || !password) {
      return { ok: false, message: "Enter your approved email and a password." };
    }

    if (password.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters." };
    }

    const supabase = createServiceRoleClient();

    const { data: application, error: applicationError } = await supabase
      .from("team_applications")
      .select("id, name, email, notes, status")
      .ilike("email", email)
      .in("status", ["approved", "invite_sent"])
      .order("reviewed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (applicationError) {
      return { ok: false, message: applicationError.message };
    }

    if (!application) {
      return {
        ok: false,
        message: "This email has not been approved for team access.",
      };
    }

    const displayName =
      (typeof application.name === "string" && application.name.trim()) ||
      email;

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        team_signup: true,
      },
    });

    if (createUserError) {
      console.error("Team signup auth user creation failed", createUserError);
      return { ok: false, message: userFacingCreateUserError(createUserError.message) };
    }

    if (createdUser.user?.id) {
      try {
        await activateTeamAccount({
          supabase,
          application: application as TeamApplication,
          userId: createdUser.user.id,
          email,
          displayName,
        });
      } catch (activationError) {
        console.error("Team signup activation failed", activationError);
      }
    }

    return {
      ok: true,
      message: "Account created. The admin will activate your sales portal shortly.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to create team account.",
    };
  }
}
