import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getWebsiteStripePriceConfig,
  getWebsiteStripePriceIds,
  type WebsiteCheckoutItem,
} from "@/lib/website-stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

function isWebsiteCheckoutItem(value: unknown): value is WebsiteCheckoutItem {
  return (
    value === "professional-website" ||
    value === "professional-website-managed"
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
    const { priceIds, missingEnvKeys } = getWebsiteStripePriceIds(item);

    if (!config || missingEnvKeys.length > 0) {
      return NextResponse.json(
        {
          error:
            "Website checkout is almost ready. Please contact us to start this project.",
          missingEnv: missingEnvKeys,
        },
        { status: 501 }
      );
    }

    const origin =
      req.headers.get("origin") || body?.origin || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: priceIds.map((price) => ({
        price,
        quantity: 1,
      })),
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
