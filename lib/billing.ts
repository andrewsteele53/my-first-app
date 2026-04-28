import type { AuthUser, SupabaseClient } from "@supabase/supabase-js";

export type BillingAccessState = "trialing" | "active" | "restricted";

export type ProfileAccess = {
  accessState: BillingAccessState;
  isSubscribed: boolean;
  isTrialing: boolean;
  isActive: boolean;
  hasProAccess: boolean;
  hasCoreAccess: boolean;
  hasAiAccess: boolean;
  subscriptionStatus: string;
  trialStart: string | null;
  trialEnd: string | null;
  trialDaysRemaining: number | null;
};

type BillingSupabaseClient = Pick<SupabaseClient, "from">;
type BillingUser = Pick<AuthUser, "id" | "email">;

export function calculateTrialDaysRemaining(trialEnd?: string | null) {
  if (!trialEnd) return null;

  const trialEndTime = new Date(trialEnd).getTime();
  if (Number.isNaN(trialEndTime)) return null;

  const msRemaining = trialEndTime - Date.now();
  if (msRemaining <= 0) return 0;

  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
}

export async function ensureProfile(
  supabase: BillingSupabaseClient,
  user: BillingUser
) {
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getProfileAccess(
  supabase: BillingSupabaseClient,
  user: BillingUser
): Promise<ProfileAccess> {
  await ensureProfile(supabase, user);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status, trial_start, trial_end")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Profile not found.");
  }

  const subscriptionStatus =
    typeof profile.subscription_status === "string" && profile.subscription_status
      ? profile.subscription_status
      : "inactive";

  const isTrialing = subscriptionStatus === "trialing";
  const isActive = subscriptionStatus === "active";
  const hasProAccess = isTrialing || isActive;
  const accessState: BillingAccessState = isActive
    ? "active"
    : isTrialing
    ? "trialing"
    : "restricted";

  const trialStart =
    typeof profile.trial_start === "string" ? profile.trial_start : null;
  const trialEnd =
    typeof profile.trial_end === "string" ? profile.trial_end : null;

  return {
    accessState,
    isSubscribed: isActive,
    isTrialing,
    isActive,
    hasProAccess,
    hasCoreAccess: hasProAccess,
    hasAiAccess: isActive,
    subscriptionStatus,
    trialStart,
    trialEnd,
    trialDaysRemaining: calculateTrialDaysRemaining(trialEnd),
  };
}
