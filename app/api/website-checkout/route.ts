import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getWebsiteStripePriceConfig,
  getWebsiteStripePriceId,
  type WebsiteCheckoutItem,
} from "@/lib/website-stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function isWebsiteCheckoutItem(value: unknown): value is WebsiteCheckoutItem {
  return (
    value === "starter-website" ||
    value === "professional-website" ||
    value === "custom-website" ||
    value === "website-management-basic" ||
    value === "website-management-growth"
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY in .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const item = body?.item;

    if (!isWebsiteCheckoutItem(item)) {
      return NextResponse.json(
        { error: "Unknown website checkout item." },
        { status: 400 }
      );
    }

    const config = getWebsiteStripePriceConfig(item);
    const priceId = getWebsiteStripePriceId(item);

    if (!config || !priceId) {
      return NextResponse.json(
        {
          error:
            "Website Stripe pricing is not configured yet. Add the matching website price ID before enabling checkout.",
          missingEnv: config?.envKey ?? null,
        },
        { status: 501 }
      );
    }

    const origin =
      req.headers.get("origin") || body?.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        business_model: "website-development",
        website_item: item,
      },
      success_url: `${origin}/website-development?checkout=success&item=${item}`,
      cancel_url: `${origin}/website-development?checkout=cancelled&item=${item}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Website Stripe checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Website checkout failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
