import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/billing";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function timestampToIso(value?: number | null) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
  };

  return timestampToIso(subscriptionWithPeriod.current_period_end);
}

async function saveSubscriptionStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  subscription: Stripe.Subscription,
  stripeCustomerId: string
) {
  const trialEndsAt = timestampToIso(subscription.trial_end);
  const { error } = await supabase
    .from("profiles")
    .update({
      is_subscribed:
        subscription.status === "active" || subscription.status === "trialing",
      subscription_status: subscription.status,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: subscription.id,
      trial_start: timestampToIso(subscription.trial_start),
      trial_end: trialEndsAt,
      trial_ends_at: trialEndsAt,
      current_period_end: getSubscriptionPeriodEnd(subscription),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

async function findTrialingSubscription(
  profileSubscriptionId: string | null,
  stripeCustomerId: string
) {
  if (profileSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(profileSubscriptionId);

    if (subscription.status === "trialing") {
      return subscription;
    }
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "trialing",
    limit: 1,
  });

  return subscriptions.data[0] ?? null;
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "Missing STRIPE_PRICE_ID in .env.local" },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureProfile(supabase, user);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "stripe_customer_id, stripe_subscription_id, subscription_status"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Could not load billing profile." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const origin =
      req.headers.get("origin") || body?.origin || "http://localhost:3000";
    const stripeCustomerId = await getOrCreateStripeCustomer(
      stripe,
      supabase,
      user
    );

    const profileSubscriptionId =
      typeof profile?.stripe_subscription_id === "string" &&
      profile.stripe_subscription_id.trim()
        ? profile.stripe_subscription_id
        : null;

    const trialingSubscription = await findTrialingSubscription(
      profileSubscriptionId,
      stripeCustomerId
    );

    if (trialingSubscription) {
      const updatedSubscription = await stripe.subscriptions.update(
        trialingSubscription.id,
        { trial_end: "now" }
      );

      await saveSubscriptionStatus(
        supabase,
        user.id,
        updatedSubscription,
        stripeCustomerId
      );

      if (updatedSubscription.status !== "active") {
        return NextResponse.json(
          {
            error:
              "Pro could not be activated immediately. Please manage billing to update your payment method.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ url: `${origin}/?pro=started` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        supabase_user_id: user.id,
        email: user.email || "",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          supabase_user_id: user.id,
          email: user.email || "",
        },
      },
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?pro=started`,
      cancel_url: `${origin}/subscribe?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create a Pro checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Start Pro Now error:", error);

    const message =
      error instanceof Error ? error.message : "Could not start Pro now.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
