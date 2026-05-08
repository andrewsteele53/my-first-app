export const WEBSITE_BUILDER_INDUSTRIES = [
  "Roofing",
  "Gutters",
  "Handyman",
  "Remodeling",
  "Landscaping",
  "Lawn Care",
  "Power Washing",
  "Junk Removal",
  "Demolition",
  "Cleaning",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Concrete",
  "Painting",
  "General Contractor",
  "Other",
] as const;

export const WEBSITE_BUILDER_STYLES = [
  "Modern",
  "Premium",
  "Rugged Contractor",
  "Clean Minimal",
  "Bold Sales-Focused",
  "Luxury",
  "Local Family-Owned",
] as const;

export const WEBSITE_BUILDER_CTA_GOALS = [
  "Call Now",
  "Request a Quote",
  "Book Online",
  "Send Message",
  "Schedule Estimate",
] as const;

export type WebsiteBuilderFormData = {
  businessName: string;
  industry: string;
  serviceArea: string;
  phone: string;
  email: string;
  currentWebsiteUrl: string;
  facebookPageUrl: string;
  mainServices: string;
  aboutBusiness: string;
  preferredStyle: string;
  brandColors: string;
  testimonials: string;
  specialOffers: string;
  ctaGoal: string;
};

export type WebsiteDraft = {
  headline: string;
  subheadline: string;
  primaryCta: string;
  aboutTitle: string;
  aboutBody: string;
  services: string[];
  whyChooseUs: string[];
  testimonials: string[];
  offer: string;
  contactLine: string;
};

function splitList(value: string, fallback: string[]) {
  const items = value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items.slice(0, 6) : fallback;
}

export function generateWebsitePrompt(formData: WebsiteBuilderFormData) {
  return `
Create modern professional website copy for a service business.

Business: ${formData.businessName || "Service Business"}
Industry: ${formData.industry || "Service Business"}
Service area: ${formData.serviceArea || "local service area"}
Main services: ${formData.mainServices || "core services"}
About the business: ${formData.aboutBusiness || "professional local service company"}
Preferred style: ${formData.preferredStyle || "Modern"}
Brand colors: ${formData.brandColors || "not provided"}
CTA goal: ${formData.ctaGoal || "Request a Quote"}
Special offers: ${formData.specialOffers || "none provided"}
Testimonials: ${formData.testimonials || "none provided"}

Write conversion-focused, local SEO-friendly copy with:
- a clear hero headline and subheadline
- trust-building service descriptions
- an about section with a professional contractor/service-business tone
- why choose us bullets
- testimonials that sound realistic if provided
- a direct CTA section
- contact-oriented closing copy

Avoid fake, cheesy, exaggerated, or overhyped claims. Keep the tone practical, polished, and credible.
`.trim();
}

export function generateWebsiteDraft(formData: WebsiteBuilderFormData): WebsiteDraft {
  const businessName = formData.businessName.trim() || "Your Business";
  const industry = formData.industry.trim() || "Service";
  const serviceArea = formData.serviceArea.trim() || "your local area";
  const ctaGoal = formData.ctaGoal.trim() || "Request a Quote";
  const services = splitList(formData.mainServices, [
    `${industry} service`,
    "Repairs and maintenance",
    "Estimates and consultations",
  ]);
  const testimonials = splitList(formData.testimonials, [
    `${businessName} was easy to work with, professional, and responsive from start to finish.`,
    `The team showed up on time, explained the work clearly, and delivered exactly what we needed.`,
  ]);

  return {
    headline: `${industry} services built around honest work and clear communication.`,
    subheadline: `${businessName} helps customers in ${serviceArea} get dependable service, straightforward estimates, and results they can feel confident about.`,
    primaryCta: ctaGoal,
    aboutTitle: `A local ${industry.toLowerCase()} company focused on doing the job right.`,
    aboutBody:
      formData.aboutBusiness.trim() ||
      `${businessName} serves homeowners and businesses with practical guidance, careful workmanship, and a simple process from first contact to final walkthrough.`,
    services,
    whyChooseUs: [
      "Clear communication before, during, and after the job",
      "Professional service built around local customer needs",
      "Fast response times for estimates and project questions",
      "Clean, organized work with attention to the details that matter",
    ],
    testimonials,
    offer: formData.specialOffers.trim() || "Ask about current availability and estimate options.",
    contactLine: `Ready to talk with ${businessName}? Call ${formData.phone || "today"} or send a message to ${formData.email || "request more information"}.`,
  };
}
