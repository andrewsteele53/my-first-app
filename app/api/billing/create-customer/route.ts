import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/billing";
import { getOrCreateStripeCustomer } from "@/lib/stripe-customers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST() {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Billing setup is not configured." },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to set up billing." },
        { status: 401 }
      );
    }

    await ensureProfile(supabase, user);

    const stripeCustomerId = await getOrCreateStripeCustomer(
      stripe,
      supabase,
      user
    );

    return NextResponse.json({ stripe_customer_id: stripeCustomerId });
  } catch (error) {
    console.error("Billing customer setup error:", error);

    return NextResponse.json(
      { error: "Could not set up billing right now." },
      { status: 500 }
    );
  }
}
