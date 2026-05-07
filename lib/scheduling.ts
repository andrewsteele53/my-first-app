export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingRow = {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_type: string | null;
  job_address: string | null;
  booking_date: string;
  start_time: string | null;
  end_time: string | null;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const SERVICE_SUGGESTIONS: Record<string, string[]> = {
  Roofing: ["Inspection", "Estimate", "Repair", "Full Roof Replacement"],
  "Landscaping / Lawn Care": ["Mowing", "Cleanup", "Landscaping Estimate"],
  Handyman: ["Repair", "Install", "Remodel Estimate"],
  "Junk Removal": ["Pickup", "Cleanout", "Estimate"],
  Demolition: ["Demo Estimate", "Interior Demo", "Haul Away"],
  Gutters: ["Cleaning", "Repair", "Estimate"],
  Siding: ["Siding Estimate", "Repair", "Replacement"],
  HVAC: ["Service Call", "Repair", "Install Estimate", "Maintenance"],
  Plumbing: ["Service Call", "Repair", "Install Estimate"],
  Electrical: ["Service Call", "Repair", "Install Estimate"],
  "Auto Detailing": ["Detail Appointment", "Estimate", "Pickup/Dropoff"],
  "Auto Repair": ["Diagnostic", "Repair", "Estimate", "Service Call"],
  Towing: ["Tow", "Roadside Call", "Impound Pickup"],
  "Residential / Commercial Cleaning": ["Cleaning", "Walkthrough", "Estimate"],
  "General Contractor": ["Consultation", "Estimate", "Project Walkthrough"],
};

export const DEFAULT_SERVICE_SUGGESTIONS = [
  "Estimate",
  "Consultation",
  "Service Call",
  "Repair",
  "Follow-up",
];

export function getSchedulingServiceSuggestions(industryLabel: string) {
  return SERVICE_SUGGESTIONS[industryLabel] ?? DEFAULT_SERVICE_SUGGESTIONS;
}

export function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "border-[rgba(47,93,138,0.22)] bg-[rgba(47,93,138,0.09)] text-[var(--color-primary)]";
    case "completed":
      return "border-[rgba(46,125,90,0.22)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]";
    case "cancelled":
      return "border-[rgba(199,80,80,0.22)] bg-[rgba(199,80,80,0.1)] text-[var(--color-danger)]";
    default:
      return "border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]";
  }
}
