export type WebsiteCheckoutMode = "payment" | "subscription";

export type WebsiteCheckoutItem =
  | "starter-website"
  | "professional-website"
  | "custom-website"
  | "website-management-basic"
  | "website-management-growth";

export type WebsiteStripePriceConfig = {
  item: WebsiteCheckoutItem;
  mode: WebsiteCheckoutMode;
  envKey: string;
};

export const websiteStripePrices: WebsiteStripePriceConfig[] = [
  {
    item: "starter-website",
    mode: "payment",
    envKey: "STRIPE_WEBSITE_STARTER_PRICE_ID",
  },
  {
    item: "professional-website",
    mode: "payment",
    envKey: "STRIPE_WEBSITE_PROFESSIONAL_PRICE_ID",
  },
  {
    item: "custom-website",
    mode: "payment",
    envKey: "STRIPE_WEBSITE_CUSTOM_DEPOSIT_PRICE_ID",
  },
  {
    item: "website-management-basic",
    mode: "subscription",
    envKey: "STRIPE_WEBSITE_MANAGEMENT_BASIC_PRICE_ID",
  },
  {
    item: "website-management-growth",
    mode: "subscription",
    envKey: "STRIPE_WEBSITE_MANAGEMENT_GROWTH_PRICE_ID",
  },
];

export function getWebsiteStripePriceConfig(item: WebsiteCheckoutItem) {
  return websiteStripePrices.find((config) => config.item === item) ?? null;
}

export function getWebsiteStripePriceId(item: WebsiteCheckoutItem) {
  const config = getWebsiteStripePriceConfig(item);

  if (!config) return null;

  const priceId = process.env[config.envKey];

  return typeof priceId === "string" && priceId.trim().length > 0
    ? priceId
    : null;
}
