import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getProfileAccess } from "@/lib/billing";
import {
  CUSTOMER_FINDER_TARGETING_RULES,
  getDefaultCustomerFinderBusinessType,
  isCustomerFinderBusinessType,
  type CustomerFinderBusinessType,
} from "@/lib/customer-finder";
import { getBusinessProfile, getProfileIndustryLabel } from "@/lib/business-profile";
import { createClient } from "@/lib/supabase/server";

type CustomerFinderLead = {
  company_name: string;
  customer_type: string;
  recommended_service_need: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  weekday_hours: string;
  lead_source: "AI Customer Finder";
  status: "New";
  follow_up_date: string;
  notes: string;
};

type CustomerFinderResponse = {
  leads: CustomerFinderLead[];
};

type ValidatedCustomerFinderRequest = {
  businessType: CustomerFinderBusinessType;
  location: string;
  radius: number;
  count: number;
};

class CustomerFinderValidationError extends Error {}

const CUSTOMER_FINDER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["leads"],
  properties: {
    leads: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "company_name",
          "customer_type",
          "recommended_service_need",
          "contact_name",
          "email",
          "phone",
          "address",
          "city",
          "state",
          "zip",
          "weekday_hours",
          "lead_source",
          "status",
          "follow_up_date",
          "notes",
        ],
        properties: {
          company_name: { type: "string" },
          customer_type: { type: "string" },
          recommended_service_need: { type: "string" },
          contact_name: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          zip: { type: "string" },
          weekday_hours: { type: "string" },
          lead_source: { type: "string", enum: ["AI Customer Finder"] },
          status: { type: "string", enum: ["New"] },
          follow_up_date: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
  },
} as const;

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFollowUpDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return getLocalDateString(date);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseRadius(value: unknown) {
  const radius =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.NaN;

  return [5, 10, 15, 25].includes(radius) ? radius : null;
}

function parseCount(value: unknown) {
  const count =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number.parseInt(value, 10)
      : Number.NaN;

  if (!Number.isFinite(count) || count < 1) return null;
  return Math.min(Math.floor(count), 20);
}

function validateRequest(body: unknown): ValidatedCustomerFinderRequest {
  if (!body || typeof body !== "object") {
    throw new CustomerFinderValidationError("Invalid request body.");
  }

  const input = body as {
    businessType?: unknown;
    location?: unknown;
    radius?: unknown;
    count?: unknown;
  };

  const rawBusinessType = cleanText(input.businessType);
  const businessType = isCustomerFinderBusinessType(rawBusinessType)
    ? rawBusinessType
    : null;
  const location = cleanText(input.location);
  const radius = parseRadius(input.radius);
  const count = parseCount(input.count);

  if (!businessType) {
    throw new CustomerFinderValidationError("Choose a supported business type.");
  }
  if (!location) {
    throw new CustomerFinderValidationError("Service area/location is required.");
  }
  if (!radius) {
    throw new CustomerFinderValidationError("Choose a supported radius.");
  }
  if (!count) {
    throw new CustomerFinderValidationError("Lead count must be between 1 and 20.");
  }

  return { businessType, location, radius, count };
}

function parseLocation(location: string) {
  const [cityPart, regionPart] = location.split(",").map((part) => part.trim());
  return {
    city: cityPart || null,
    region: regionPart || null,
  };
}

function sanitizeLead(
  lead: Partial<CustomerFinderLead>,
  followUpDate: string
): CustomerFinderLead {
  return {
    company_name: cleanText(lead.company_name) || "n/a",
    customer_type: cleanText(lead.customer_type) || "n/a",
    recommended_service_need:
      cleanText(lead.recommended_service_need) || "n/a",
    contact_name: cleanText(lead.contact_name) || "n/a",
    email: cleanText(lead.email) || "n/a",
    phone: cleanText(lead.phone) || "n/a",
    address: cleanText(lead.address) || "n/a",
    city: cleanText(lead.city) || "n/a",
    state: cleanText(lead.state) || "n/a",
    zip: cleanText(lead.zip) || "n/a",
    weekday_hours: cleanText(lead.weekday_hours) || "n/a",
    lead_source: "AI Customer Finder",
    status: "New",
    follow_up_date: followUpDate,
    notes: cleanText(lead.notes) || "Verify before outreach.",
  };
}

function sanitizeResponse(
  data: Partial<CustomerFinderResponse>,
  followUpDate: string,
  count: number
): CustomerFinderResponse {
  const leads = Array.isArray(data.leads) ? data.leads : [];
  return {
    leads: leads
      .slice(0, count)
      .map((lead) => sanitizeLead(lead, followUpDate)),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getProfileAccess(supabase, user);

    if (!access.hasAiAccess) {
      return NextResponse.json(
        { error: "AI Customer Finder is available on the Pro plan." },
        { status: 403 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const validated = validateRequest(body);
    const businessProfile = await getBusinessProfile(supabase, user).catch(
      () => null
    );
    const profileIndustry = businessProfile
      ? getProfileIndustryLabel(businessProfile)
      : null;
    const defaultBusinessType =
      getDefaultCustomerFinderBusinessType(profileIndustry);
    const followUpDate = getFollowUpDate();
    const locationParts = parseLocation(validated.location);
    const client = new OpenAI({ apiKey });
    const targetingRules = CUSTOMER_FINDER_TARGETING_RULES[validated.businessType];

    const response = await client.responses.create({
      model: process.env.OPENAI_CUSTOMER_FINDER_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini",
      tools: [
        {
          type: "web_search",
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            country: "US",
            city: locationParts.city,
            region: locationParts.region,
            timezone: "America/Chicago",
          },
        },
      ],
      input: [
        {
          role: "system",
          content:
            "You are the Unified Steele AI Customer Finder. Return JSON only. Find potential customers for the subscriber's business, not competitors. Competitors may appear only when they are reasonable referral partners. Prefer real businesses, property contacts, organizations, or customer categories near the service area. Use n/a for missing information. Do not invent fake emails. Do not invent fake phone numbers. AI-generated customer leads should be verified before outreach.",
        },
        {
          role: "user",
          content: JSON.stringify({
            businessType: validated.businessType,
            subscriberProfileBusinessType: defaultBusinessType,
            location: validated.location,
            radiusMiles: validated.radius,
            leadCount: validated.count,
            targetingRules,
            requiredFollowUpDate: followUpDate,
            requiredStatus: "New",
            requiredLeadSource: "AI Customer Finder",
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "customer_finder_response",
          strict: true,
          schema: CUSTOMER_FINDER_SCHEMA,
        },
      },
      max_output_tokens: 4000,
    });

    const text = response.output_text?.trim();
    if (!text) {
      throw new Error("Could not generate customer leads. Try again.");
    }

    const parsed = JSON.parse(text) as Partial<CustomerFinderResponse>;
    return NextResponse.json(sanitizeResponse(parsed, followUpDate, validated.count));
  } catch (error) {
    if (error instanceof CustomerFinderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Could not generate customer leads. Try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
