import type { AuthUser, SupabaseClient } from "@supabase/supabase-js";
import { getServiceCategory } from "@/lib/service-categories";

export const INDUSTRY_OPTIONS = [
  "Roofing",
  "Siding",
  "Gutters",
  "Landscaping / Lawn Care",
  "Junk Removal",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Auto Detailing",
  "Automotive Mechanic",
  "Power Sports Mechanic",
  "Handyman",
  "Cleaning",
  "Construction",
  "Towing",
  "Other",
] as const;

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
  "Junk Removal": "junk-removal",
  HVAC: "hvac",
  Plumbing: "plumbing",
  Electrical: "electrician",
  "Auto Detailing": "car-detailing",
  "Automotive Mechanic": "automotive-mechanic",
  "Power Sports Mechanic": "power-sports-mechanic",
  Handyman: "handyman",
  Cleaning: "cleaning",
  Construction: "construction",
  Towing: "towing",
  Other: "general",
};

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function getTemplateSlugForIndustry(industry?: string | null) {
  const match = INDUSTRY_OPTIONS.find((option) => option === industry);
  return match ? INDUSTRY_TEMPLATE_MAP[match] : "general";
}

export function getProfileDefaultQuoteSlug(profile?: Partial<BusinessProfile> | null) {
  return clean(profile?.default_quote_type) || getTemplateSlugForIndustry(profile?.industry);
}

export function getProfileDefaultInvoiceSlug(profile?: Partial<BusinessProfile> | null) {
  return clean(profile?.default_invoice_type) || getTemplateSlugForIndustry(profile?.industry);
}

export function getProfileIndustryLabel(profile?: Partial<BusinessProfile> | null) {
  return clean(profile?.industry) || "General";
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
    throw new Error(error.message);
  }

  return (data as BusinessProfile | null) ?? null;
}

export async function updateBusinessProfile(
  supabase: BusinessSupabaseClient,
  user: BusinessUser,
  input: BusinessProfileInput
) {
  const businessName = clean(input.business_name);
  const industry = clean(input.industry);

  if (!businessName) {
    throw new Error("Business name is required.");
  }

  if (!industry) {
    throw new Error("Industry is required.");
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
