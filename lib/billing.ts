import type { AuthUser, SupabaseClient } from "@supabase/supabase-js";
import { FREE_INVOICE_LIMIT } from "@/lib/free-invoice-limit";

export type ProfileAccess = {
  isSubscribed: boolean;
  subscriptionStatus: string;
  freeInvoicesUsed: number;
  freeInvoicesRemaining: number | null;
};

type BillingSupabaseClient = Pick<SupabaseClient, "from">;
type BillingUser = Pick<AuthUser, "id" | "email">;

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
    .select("is_subscribed, subscription_status, free_invoices_used")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error(error?.message || "Profile not found.");
  }

  const isSubscribed = !!profile.is_subscribed;
  const freeInvoicesUsed = profile.free_invoices_used ?? 0;

  return {
    isSubscribed,
    subscriptionStatus: profile.subscription_status || "inactive",
    freeInvoicesUsed,
    freeInvoicesRemaining: isSubscribed
      ? null
      : Math.max(FREE_INVOICE_LIMIT - freeInvoicesUsed, 0),
  };
}
