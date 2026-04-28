import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

type ProfileUpdate = {
  is_subscribed: boolean;
  subscription_status: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  trial_start?: string | null;
  trial_end?: string | null;
  current_period_end?: string | null;
};

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Stripe webhook handling."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function isActiveStatus(status: string) {
  return status === "active" || status === "trialing";
}

function withoutStripeColumns(update: ProfileUpdate) {
  const baseUpdate: ProfileUpdate = { ...update };
  delete baseUpdate.stripe_customer_id;
  delete baseUpdate.stripe_subscription_id;
  delete baseUpdate.trial_start;
  delete baseUpdate.trial_end;
  delete baseUpdate.current_period_end;

  return baseUpdate;
}

async function updateProfileById(userId: string, update: ProfileUpdate) {
  const supabaseAdmin = createSupabaseAdminClient();
  const result = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (!result.error) return;

  const fallback = await supabaseAdmin
    .from("profiles")
    .update(withoutStripeColumns(update))
    .eq("id", userId);

  if (fallback.error) {
    throw fallback.error;
  }
}

async function updateProfileByEmail(email: string, update: ProfileUpdate) {
  const supabaseAdmin = createSupabaseAdminClient();
  const result = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("email", email);

  if (!result.error) return;

  const fallback = await supabaseAdmin
    .from("profiles")
    .update(withoutStripeColumns(update))
    .eq("email", email);

  if (fallback.error) {
    throw fallback.error;
  }
}

async function updateProfileByStripeId(
  column: "stripe_subscription_id" | "stripe_customer_id",
  value: string,
  update: ProfileUpdate
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const result = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq(column, value)
    .select("id");

  if (!result.error) return result.data ?? [];

  const fallback = await supabaseAdmin
    .from("profiles")
    .update(withoutStripeColumns(update))
    .eq(column, value)
    .select("id");

  if (fallback.error) {
    throw fallback.error;
  }

  return fallback.data ?? [];
}

function getCustomerId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function getSubscriptionId(
  value: string | Stripe.Subscription | null
) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function timestampToIso(value?: number | null) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };

  return timestampToIso(subscriptionWithPeriod.current_period_end);
}

function buildSubscriptionProfileUpdate(
  subscription: Stripe.Subscription,
  customerId: string | null
): ProfileUpdate {
  return {
    is_subscribed: isActiveStatus(subscription.status),
    subscription_status: subscription.status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    trial_start: timestampToIso(subscription.trial_start),
    trial_end: timestampToIso(subscription.trial_end),
    current_period_end: getSubscriptionPeriodEnd(subscription),
  };
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId =
    session.metadata?.user_id ||
    session.metadata?.supabase_user_id ||
    session.client_reference_id;

  const customerId = getCustomerId(session.customer);
  const subscriptionId = getSubscriptionId(session.subscription);
  let update: ProfileUpdate = {
    is_subscribed: false,
    subscription_status: "inactive",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    trial_start: null,
    trial_end: null,
    current_period_end: null,
  };

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    update = buildSubscriptionProfileUpdate(subscription, customerId);
  }

  if (userId) {
    await updateProfileById(userId, update);
    return;
  }

  const email =
    session.customer_details?.email || session.customer_email || session.metadata?.email;

  if (email) {
    await updateProfileByEmail(email, update);
    return;
  }

  console.warn(
    "Stripe checkout session completed without user_id metadata or customer email."
  );
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription.customer);
  const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;
  const update = buildSubscriptionProfileUpdate(subscription, customerId);

  if (userId) {
    await updateProfileById(userId, update);
    return;
  }

  const updatedBySubscription = await updateProfileByStripeId(
    "stripe_subscription_id",
    subscription.id,
    update
  );

  if (updatedBySubscription.length > 0 || !customerId) return;

  await updateProfileByStripeId("stripe_customer_id", customerId, update);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature." },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET." },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature failed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);

    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
