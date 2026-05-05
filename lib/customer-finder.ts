export const CUSTOMER_FINDER_BUSINESS_TYPES = [
  "Roofing",
  "Siding",
  "Gutters",
  "Landscaping / Lawn Care",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Auto Detailing",
  "Auto Repair",
  "Power Sports Mechanic",
  "Towing",
  "Residential / Commercial Cleaning",
  "Junk Removal",
  "Demolition",
  "Handyman",
  "General Contractor",
] as const;

export type CustomerFinderBusinessType =
  (typeof CUSTOMER_FINDER_BUSINESS_TYPES)[number];

export type CustomerFinderLead = {
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

export const CUSTOMER_FINDER_RADII = ["5", "10", "15", "25"] as const;
export const CUSTOMER_FINDER_COUNTS = [5, 10, 20] as const;
export const DEFAULT_CUSTOMER_FINDER_BUSINESS_TYPE = "Gutters";

export const CUSTOMER_FINDER_TARGETING_RULES: Record<
  CustomerFinderBusinessType,
  string
> = {
  Roofing:
    "Find property managers, HOAs, commercial buildings, apartment complexes, landlords, real estate investors, older homes, storm-damage opportunities, insurance-related property contacts, and general contractors needing roofing subs.",
  Siding:
    "Find homeowners in older neighborhoods, property managers, landlords, HOAs, real estate investors, apartment complexes, remodelers, exterior renovation opportunities, and general contractors needing siding subs.",
  Gutters:
    "Find homeowners, property managers, older homes, landlords, HOAs, realtors, roofing referral partners, apartment complexes, and commercial buildings with maintenance needs.",
  "Landscaping / Lawn Care":
    "Find HOAs, apartment complexes, commercial plazas, business parks, property managers, realtors, landlords, homeowners, churches, schools, and small businesses with outdoor maintenance needs.",
  HVAC:
    "Find restaurants, offices, retail spaces, property managers, landlords, apartment complexes, older homes, commercial buildings, salons, gyms, and small businesses needing heating/cooling maintenance.",
  Plumbing:
    "Find restaurants, apartment complexes, property managers, landlords, commercial buildings, offices, salons, gyms, daycares, older homes, and small businesses with plumbing maintenance needs.",
  Electrical:
    "Find remodelers, property managers, landlords, commercial buildings, offices, restaurants, retail spaces, apartment complexes, general contractors, and businesses needing electrical upgrades or repairs.",
  "Auto Detailing":
    "Find used car lots, dealerships, fleet companies, realtors, rideshare drivers, delivery drivers, small businesses with vehicles, trucking companies, car clubs, and busy professionals.",
  "Auto Repair":
    "Find fleet owners, delivery companies, used car dealers, towing companies, contractors with work vehicles, small businesses with vans/trucks, rideshare drivers, and local commercial vehicle owners.",
  "Power Sports Mechanic":
    "Find motorcycle owners, ATV/UTV owners, boat owners, marinas, powersports dealerships, landscaping companies with small engines, contractors with small equipment, storage facilities, and recreational vehicle owners.",
  Towing:
    "Find auto shops, dealerships, apartment complexes, property managers, businesses with parking lots, commercial plazas, fleet companies, body shops, police-adjacent impound opportunities, and roadside-assistance referral partners.",
  "Residential / Commercial Cleaning":
    "Find offices, salons, gyms, clinics, daycares, property managers, apartment complexes, realtors, landlords, small businesses, churches, schools, and move-out cleaning opportunities.",
  "Junk Removal":
    "Find realtors, landlords, property managers, storage facilities, apartment complexes, estate cleanout opportunities, foreclosure cleanup opportunities, contractors, remodelers, and homeowners.",
  Demolition:
    "Find real estate investors, remodelers, general contractors, property managers, landlords, homeowners planning renovations, small commercial property owners, shed or garage removal opportunities, deck replacement leads, concrete removal needs, and cleanout referral partners.",
  Handyman:
    "Find landlords, property managers, realtors, apartment complexes, HOAs, homeowners, small businesses, offices, retail spaces, and people needing small repair jobs.",
  "General Contractor":
    "Find real estate investors, landlords, property managers, homeowners, commercial property owners, insurance-related repair opportunities, remodel leads, realtors, and businesses needing renovation work.",
};

export function isCustomerFinderBusinessType(
  value: string
): value is CustomerFinderBusinessType {
  return (CUSTOMER_FINDER_BUSINESS_TYPES as readonly string[]).includes(value);
}

export function getDefaultCustomerFinderBusinessType(industry?: string | null) {
  const cleanIndustry = typeof industry === "string" ? industry.trim() : "";
  return isCustomerFinderBusinessType(cleanIndustry)
    ? cleanIndustry
    : DEFAULT_CUSTOMER_FINDER_BUSINESS_TYPE;
}
