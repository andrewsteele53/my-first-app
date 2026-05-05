import type { AuthUser, SupabaseClient } from "@supabase/supabase-js";
import { getServiceCategory } from "@/lib/service-categories";

export const INDUSTRY_GROUPS = [
  {
    group: "Home Services",
    options: [
      {
        name: "Roofing",
        icon: "RF",
        helper: "Roof repairs, replacements, inspections, and exterior work.",
      },
      {
        name: "Siding",
        icon: "SD",
        helper: "Siding installs, repairs, trim, and exterior finish jobs.",
      },
      {
        name: "Gutters",
        icon: "GT",
        helper: "Gutter cleaning, repairs, downspouts, and replacements.",
      },
      {
        name: "Landscaping / Lawn Care",
        icon: "LC",
        helper: "Lawn care, maintenance, cleanup, and landscaping work.",
      },
      {
        name: "HVAC",
        icon: "HV",
        helper: "Heating, cooling, service calls, installs, and repairs.",
      },
      {
        name: "Plumbing",
        icon: "PL",
        helper: "Service calls, repairs, installs, and maintenance.",
      },
      {
        name: "Electrical",
        icon: "EL",
        helper: "Electrical service, installs, repairs, and inspections.",
      },
    ],
  },
  {
    group: "Automotive",
    options: [
      {
        name: "Auto Detailing",
        icon: "AD",
        helper: "Detail packages, customer vehicles, add-ons, and follow-ups.",
      },
      {
        name: "Auto Repair",
        icon: "AR",
        helper: "Repairs, diagnostics, labor, parts, and service records.",
      },
      {
        name: "Power Sports Mechanic",
        icon: "PS",
        helper: "ATV, motorcycle, marine, and power sports repair work.",
      },
      {
        name: "Towing",
        icon: "TW",
        helper: "Towing jobs, roadside calls, impounds, and customer records.",
      },
    ],
  },
  {
    group: "Cleaning & Labor",
    options: [
      {
        name: "Residential / Commercial Cleaning",
        icon: "CL",
        helper: "Cleaning jobs, recurring work, quotes, and invoices.",
      },
      {
        name: "Junk Removal",
        icon: "JR",
        helper: "Hauling, removal, disposal, and cleanout jobs.",
      },
      {
        name: "Demolition",
        icon: "DM",
        helper: "Interior demo, removals, debris hauling, and site cleanup.",
      },
    ],
  },
  {
    group: "General Trades",
    options: [
      {
        name: "Handyman",
        icon: "HM",
        helper: "Small repairs, punch lists, maintenance, and service calls.",
      },
      {
        name: "General Contractor",
        icon: "GC",
        helper: "Construction, remodels, project scopes, and contractor work.",
      },
    ],
  },
  {
    group: "Other",
    options: [
      {
        name: "Other",
        icon: "OT",
        helper: "Use a general setup and describe your business your way.",
      },
    ],
  },
] as const;

export const INDUSTRY_OPTIONS = INDUSTRY_GROUPS.flatMap((group) =>
  group.options.map((option) => option.name)
);

export type IndustryOption = (typeof INDUSTRY_OPTIONS)[number];

export type BusinessProfile = {
  id: string;
  email: string | null;
  business_name: string | null;
  owner_name: string | null;
  industry: string | null;
  services_offered: string | null;
  default_quote_type: string | null;
  default_invoice_type: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_logo_url: string | null;
  custom_industry: string | null;
  onboarding_completed: boolean;
  updated_at: string | null;
};

export type BusinessProfileInput = {
  business_name: string;
  owner_name?: string;
  industry: string;
  services_offered?: string;
  default_quote_type?: string;
  default_invoice_type?: string;
  business_phone?: string;
  business_email?: string;
  business_logo_url?: string;
  custom_industry?: string;
  onboarding_completed?: boolean;
};

type BusinessSupabaseClient = Pick<SupabaseClient, "from">;
type BusinessUser = Pick<AuthUser, "id" | "email">;

// Industry-to-template mapping lives here so onboarding, settings, dashboard,
// invoices, quotes, and AI all use the same default routing rules.
export const INDUSTRY_TEMPLATE_MAP: Record<IndustryOption, string> = {
  Roofing: "roofing",
  Siding: "siding",
  Gutters: "gutter-cleaning",
  "Landscaping / Lawn Care": "lawn-care",
  HVAC: "hvac",
  Plumbing: "plumbing",
  Electrical: "electrician",
  "Auto Detailing": "car-detailing",
  "Auto Repair": "automotive-mechanic",
  "Power Sports Mechanic": "power-sports-mechanic",
  Towing: "towing",
  "Residential / Commercial Cleaning": "cleaning",
  "Junk Removal": "junk-removal",
  Demolition: "demolition",
  Handyman: "handyman",
  "General Contractor": "construction",
  Other: "general",
};

const LEGACY_INDUSTRY_MAP: Record<string, IndustryOption> = {
  "Automotive Mechanic": "Auto Repair",
  Cleaning: "Residential / Commercial Cleaning",
  Construction: "General Contractor",
};

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function createFallbackBusinessProfile(user: BusinessUser): BusinessProfile {
  return {
    id: user.id,
    email: user.email ?? null,
    business_name: null,
    owner_name: null,
    industry: null,
    services_offered: null,
    default_quote_type: "general",
    default_invoice_type: "general",
    business_phone: null,
    business_email: null,
    business_logo_url: null,
    custom_industry: null,
    onboarding_completed: true,
    updated_at: null,
  };
}

export function normalizeIndustry(industry?: string | null): IndustryOption | "" {
  const value = clean(industry);
  if (!value) return "";

  const legacy = LEGACY_INDUSTRY_MAP[value];
  if (legacy) return legacy;

  const match = INDUSTRY_OPTIONS.find((option) => option === value);
  return match || "Other";
}

export function getTemplateSlugForIndustry(industry?: string | null) {
  const match = normalizeIndustry(industry);
  return match ? INDUSTRY_TEMPLATE_MAP[match] : "general";
}

export function getProfileDefaultQuoteSlug(profile?: Partial<BusinessProfile> | null) {
  return clean(profile?.default_quote_type) || getTemplateSlugForIndustry(profile?.industry);
}

export function getProfileDefaultInvoiceSlug(profile?: Partial<BusinessProfile> | null) {
  return clean(profile?.default_invoice_type) || getTemplateSlugForIndustry(profile?.industry);
}

export function getProfileIndustryLabel(profile?: Partial<BusinessProfile> | null) {
  const normalized = normalizeIndustry(profile?.industry);
  if (normalized === "Other") {
    return clean(profile?.custom_industry) || clean(profile?.industry) || "Other";
  }

  return normalized || "General";
}

export function getProfileQuoteLabel(profile?: Partial<BusinessProfile> | null) {
  const slug = getProfileDefaultQuoteSlug(profile);
  return getServiceCategory(slug)?.name || "General";
}

export function getProfileInvoiceLabel(profile?: Partial<BusinessProfile> | null) {
  const slug = getProfileDefaultInvoiceSlug(profile);
  return getServiceCategory(slug)?.name || "General";
}

export function getBusinessProfileSelect() {
  return [
    "id",
    "email",
    "business_name",
    "owner_name",
    "industry",
    "services_offered",
    "default_quote_type",
    "default_invoice_type",
    "business_phone",
    "business_email",
    "business_logo_url",
    "custom_industry",
    "onboarding_completed",
    "updated_at",
  ].join(", ");
}

export async function ensureBusinessProfile(
  supabase: BusinessSupabaseClient,
  user: BusinessUser
) {
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getBusinessProfile(
  supabase: BusinessSupabaseClient,
  user: BusinessUser
): Promise<BusinessProfile | null> {
  await ensureBusinessProfile(supabase, user);

  const { data, error } = await supabase
    .from("profiles")
    .select(getBusinessProfileSelect())
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Business profile read failed:", error.message);
    return createFallbackBusinessProfile(user);
  }

  return (data as BusinessProfile | null) ?? null;
}

export async function updateBusinessProfile(
  supabase: BusinessSupabaseClient,
  user: BusinessUser,
  input: BusinessProfileInput
) {
  const businessName = clean(input.business_name);
  const industry = normalizeIndustry(input.industry);
  const customIndustry = clean(input.custom_industry);

  if (!businessName) {
    throw new Error("Business name is required.");
  }

  if (!industry) {
    throw new Error("Industry is required.");
  }

  if (industry === "Other" && !customIndustry) {
    throw new Error("Custom industry is required when Other is selected.");
  }

  const defaultSlug = getTemplateSlugForIndustry(industry);
  const defaultQuoteType = clean(input.default_quote_type) || defaultSlug;
  const defaultInvoiceType = clean(input.default_invoice_type) || defaultSlug;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email ?? null,
      business_name: businessName,
      owner_name: clean(input.owner_name) || null,
      industry,
      services_offered: clean(input.services_offered) || null,
      default_quote_type: defaultQuoteType,
      default_invoice_type: defaultInvoiceType,
      business_phone: clean(input.business_phone) || null,
      business_email: clean(input.business_email) || null,
      business_logo_url: clean(input.business_logo_url) || null,
      custom_industry: industry === "Other" ? customIndustry : null,
      onboarding_completed: input.onboarding_completed ?? true,
      updated_at: new Date().toISOString(),
    })
    .select(getBusinessProfileSelect())
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as BusinessProfile;
}
