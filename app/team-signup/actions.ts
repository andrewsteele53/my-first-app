"use server";

import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js";

export type TeamSignupResult = {
  ok: boolean;
  message: string;
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
      .select("id, name, email, status")
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

    const { error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        team_signup: true,
      },
    });

    if (createUserError) {
      return { ok: false, message: createUserError.message };
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
