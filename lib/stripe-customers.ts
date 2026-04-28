import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

type StripeCustomerUser = {
  id: string;
  email?: string | null;
};

type CustomerLookupSource =
  | "profile"
  | "metadata_supabase_user_id"
  | "metadata_user_id"
  | "email"
  | "created";

function getProfileCustomerId(profile?: { stripe_customer_id?: unknown } | null) {
  return typeof profile?.stripe_customer_id === "string" &&
    profile.stripe_customer_id.trim()
    ? profile.stripe_customer_id
    : null;
}

function escapeSearchValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function saveStripeCustomerId(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  stripeCustomerId: string,
  source: CustomerLookupSource
) {
  const { error } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", userId);

  if (error) {
    console.error("Could not save Stripe customer ID:", {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      source,
      error,
    });

    throw new Error("Could not save Stripe customer for this account.");
  }
}

async function findCustomerByMetadata(
  stripe: Stripe,
  key: "supabase_user_id" | "user_id",
  userId: string
) {
  const result = await stripe.customers.search({
    query: `metadata['${key}']:'${escapeSearchValue(userId)}'`,
    limit: 1,
  });

  return result.data[0] ?? null;
}

async function findCustomerByEmail(stripe: Stripe, email: string) {
  const result = await stripe.customers.search({
    query: `email:'${escapeSearchValue(email)}'`,
    limit: 1,
  });

  return result.data[0] ?? null;
}

export async function getOrCreateStripeCustomer(
  stripe: Stripe,
  supabase: Pick<SupabaseClient, "from">,
  user: StripeCustomerUser
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error("Could not load billing profile.");
  }

  const profileCustomerId = getProfileCustomerId(profile);

  if (profileCustomerId) {
    console.log("Stripe customer lookup: reused profile stripe_customer_id", {
      user_id: user.id,
      stripe_customer_id: profileCustomerId,
    });

    return profileCustomerId;
  }

  const metadataSupabaseCustomer = await findCustomerByMetadata(
    stripe,
    "supabase_user_id",
    user.id
  );

  if (metadataSupabaseCustomer) {
    await saveStripeCustomerId(
      supabase,
      user.id,
      metadataSupabaseCustomer.id,
      "metadata_supabase_user_id"
    );

    console.log("Stripe customer lookup: found existing customer by metadata", {
      user_id: user.id,
      metadata_key: "supabase_user_id",
      stripe_customer_id: metadataSupabaseCustomer.id,
    });

    return metadataSupabaseCustomer.id;
  }

  const metadataUserCustomer = await findCustomerByMetadata(
    stripe,
    "user_id",
    user.id
  );

  if (metadataUserCustomer) {
    await saveStripeCustomerId(
      supabase,
      user.id,
      metadataUserCustomer.id,
      "metadata_user_id"
    );

    console.log("Stripe customer lookup: found existing customer by metadata", {
      user_id: user.id,
      metadata_key: "user_id",
      stripe_customer_id: metadataUserCustomer.id,
    });

    return metadataUserCustomer.id;
  }

  if (user.email) {
    const emailCustomer = await findCustomerByEmail(stripe, user.email);

    if (emailCustomer) {
      await saveStripeCustomerId(supabase, user.id, emailCustomer.id, "email");

      console.log("Stripe customer lookup: found existing customer by email", {
        user_id: user.id,
        email: user.email,
        stripe_customer_id: emailCustomer.id,
      });

      return emailCustomer.id;
    }
  }

  const customer = await stripe.customers.create(
    {
      ...(user.email ? { email: user.email } : {}),
      metadata: {
        user_id: user.id,
        supabase_user_id: user.id,
        email: user.email || "",
      },
    },
    {
      idempotencyKey: `supabase-customer-${user.id}`,
    }
  );

  await saveStripeCustomerId(supabase, user.id, customer.id, "created");

  console.log("Stripe customer lookup: created new customer", {
    user_id: user.id,
    email: user.email || null,
    stripe_customer_id: customer.id,
  });

  return customer.id;
}
