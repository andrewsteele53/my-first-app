import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = clean(body.name);
    const businessName = clean(body.businessName);
    const email = clean(body.email);
    const phone = clean(body.phone);
    const packageInterested = clean(body.packageInterested);

    if (!name || !businessName || !email || !phone || !packageInterested) {
      return NextResponse.json(
        { error: "Please complete the required fields before submitting." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("website_preview_requests").insert({
      name,
      business_name: businessName,
      email,
      phone,
      industry: clean(body.industry) || null,
      current_website_url: clean(body.currentWebsiteUrl) || null,
      business_profile_url: clean(body.business_profile_url) || null,
      services_offered: clean(body.servicesOffered) || null,
      preferred_colors_style: clean(body.preferredColorsStyle) || null,
      websites_they_like: clean(body.websitesTheyLike) || null,
      package_interested: packageInterested,
      message: clean(body.message) || null,
      status: "new",
    });

    if (error) {
      console.error("Website preview request insert failed", error);
      return NextResponse.json(
        { error: "We could not submit your request right now. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Website preview request handler failed", error);
    return NextResponse.json(
      { error: "We could not submit your request right now. Please try again." },
      { status: 500 }
    );
  }
}
