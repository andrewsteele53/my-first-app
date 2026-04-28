import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/billing";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Could not load billing profile." },
        { status: 500 }
      );
    }

    const existingCustomerId =
      typeof profile?.stripe_customer_id === "string" &&
      profile.stripe_customer_id.trim()
        ? profile.stripe_customer_id
        : null;

    if (existingCustomerId) {
      return NextResponse.json({ stripe_customer_id: existingCustomerId });
    }

    const customer = await stripe.customers.create({
      ...(user.email ? { email: user.email } : {}),
      metadata: {
        user_id: user.id,
        supabase_user_id: user.id,
        email: user.email || "",
      },
    });

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);

    if (updateError) {
      console.error("Could not save Stripe customer ID:", {
        user_id: user.id,
        stripe_customer_id: customer.id,
        error: updateError,
      });

      return NextResponse.json(
        { error: "Could not finish billing setup." },
        { status: 500 }
      );
    }

    return NextResponse.json({ stripe_customer_id: customer.id });
  } catch (error) {
    console.error("Billing customer setup error:", error);

    return NextResponse.json(
      { error: "Could not set up billing right now." },
      { status: 500 }
    );
  }
}
