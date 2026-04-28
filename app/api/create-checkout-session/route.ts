import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/billing";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

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

    const body = await req.json().catch(() => ({}));
    const origin =
      req.headers.get("origin") || body?.origin || "http://localhost:3000";
    const stripeCustomerId = await getOrCreateStripeCustomer(
      stripe,
      supabase,
      user
    );

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
        trial_period_days: 30,
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
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/subscribe?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Stripe checkout failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
