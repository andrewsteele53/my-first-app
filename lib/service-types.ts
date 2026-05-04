export const LEAD_SERVICE_TYPES = [
  "Gutter Cleaning",
  "Pressure Washing",
  "Lawn Care",
  "Landscaping",
  "Handyman",
  "Construction",
  "Cleaning",
  "Roofing",
  "Siding",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Painting",
  "Flooring",
  "Concrete",
  "Drywall",
  "Fencing",
  "Tree Service",
  "Snow Removal",
  "Junk Removal",
  "Demolition",
  "Moving",
  "Towing",
  "Auto Detailing",
  "Mechanic / Auto Repair",
  "Pest Control",
  "Pool Service",
  "Window Cleaning",
  "Carpet Cleaning",
  "Appliance Repair",
  "Home Inspection",
  "Property Maintenance",
  "Other",
] as const;

export const DEFAULT_LEAD_SERVICE_TYPE = "Gutter Cleaning";

export function isLeadServiceType(value: string) {
  return (LEAD_SERVICE_TYPES as readonly string[]).includes(value);
}
