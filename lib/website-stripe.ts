export type WebsiteCheckoutMode = "payment" | "subscription";

export type WebsiteCheckoutItem =
  | "professional-website"
  | "professional-website-managed";

export type WebsiteStripePriceConfig = {
  item: WebsiteCheckoutItem;
  mode: WebsiteCheckoutMode;
  envKeys: string[];
};

export const websiteStripePrices: WebsiteStripePriceConfig[] = [
  {
    item: "professional-website",
    mode: "payment",
    envKeys: ["NEXT_PUBLIC_STRIPE_WEBSITE_ONE_TIME_PRICE_ID"],
  },
  {
    item: "professional-website-managed",
    mode: "subscription",
    envKeys: [
      "NEXT_PUBLIC_STRIPE_WEBSITE_MANAGED_SETUP_PRICE_ID",
      "NEXT_PUBLIC_STRIPE_WEBSITE_MANAGEMENT_MONTHLY_PRICE_ID",
    ],
  },
];

export function getWebsiteStripePriceConfig(item: WebsiteCheckoutItem) {
  return websiteStripePrices.find((config) => config.item === item) ?? null;
}

export function getWebsiteStripePriceIds(item: WebsiteCheckoutItem) {
  const config = getWebsiteStripePriceConfig(item);

  if (!config) {
    return { priceIds: [], missingEnvKeys: [] };
  }

  const priceIds = config.envKeys
    .map((envKey) => process.env[envKey])
    .filter((priceId): priceId is string =>
      typeof priceId === "string" && priceId.trim().length > 0
    );

  const missingEnvKeys = config.envKeys.filter((envKey) => !process.env[envKey]);

  return { priceIds, missingEnvKeys };
}
