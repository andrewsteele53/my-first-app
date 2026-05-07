import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getWebsiteStripePriceConfig,
  getWebsiteStripePriceIds,
  type WebsiteCheckoutType,
} from "@/lib/website-stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function isWebsiteCheckoutType(value: unknown): value is WebsiteCheckoutType {
  return value === "one_time_website" || value === "managed_website";
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("Website checkout is missing Stripe server configuration.");

      return NextResponse.json(
        {
          error:
            "We could not start checkout right now. Please contact us to start your project.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const checkoutType = body?.type;

    if (!isWebsiteCheckoutType(checkoutType)) {
      return NextResponse.json(
        { error: "Invalid website checkout type." },
        { status: 400 }
      );
    }

    const config = getWebsiteStripePriceConfig(checkoutType);
    const { priceIds, missingEnvKeys } = getWebsiteStripePriceIds(checkoutType);

    if (!config || missingEnvKeys.length > 0) {
      console.error("Website checkout pricing is not configured.", {
        checkoutType,
        missingEnvKeys,
      });

      return NextResponse.json(
        {
          error:
            "We could not start checkout right now. Please contact us to start your project.",
        },
        { status: 500 }
      );
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // TODO: Future improvement: enforce or invoice remaining 3-month minimum management balance if a managed website customer cancels early.
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: priceIds.map((price) => ({
        price,
        quantity: 1,
      })),
      metadata: {
        business_model: "website-development",
        checkout_type: checkoutType,
      },
      success_url: `${origin}/website-development?checkout=success`,
      cancel_url: `${origin}/website-development?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Website Stripe checkout error:", error);

    return NextResponse.json(
      {
        error:
          "We could not start checkout right now. Please contact us to start your project.",
      },
      { status: 500 }
    );
  }
}
