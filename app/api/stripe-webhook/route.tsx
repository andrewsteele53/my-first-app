import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

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
  return ["active", "trialing", "past_due"].includes(status);
}

export async function POST(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET in .env.local" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId =
          session.metadata?.supabase_user_id || session.client_reference_id;

        if (userId) {
          await supabaseAdmin.from("profiles").update({
            email: session.customer_details?.email || session.metadata?.email || null,
            is_subscribed: true,
            subscription_status: "active",
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          }).eq("id", userId);
        }

        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const nextValues = {
          is_subscribed:
            event.type === "customer.subscription.deleted"
              ? false
              : isActiveStatus(subscription.status),
          subscription_status: subscription.status,
          stripe_customer_id:
            typeof subscription.customer === "string"
              ? subscription.customer
              : null,
          stripe_subscription_id: subscription.id,
        };

        const updateBySubscription = await supabaseAdmin
          .from("profiles")
          .update(nextValues)
          .eq("stripe_subscription_id", subscription.id)
          .select("id");

        if (updateBySubscription.error) {
          console.error(updateBySubscription.error);
        }

        if (updateBySubscription.data && updateBySubscription.data.length === 0) {
          const updateByCustomer = await supabaseAdmin
            .from("profiles")
            .update(nextValues)
            .eq(
              "stripe_customer_id",
              typeof subscription.customer === "string"
                ? subscription.customer
                : ""
            )
            .select("id");

          if (updateByCustomer.error) {
            console.error(updateByCustomer.error);
          }
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
