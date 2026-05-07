export type WebsiteCheckoutType = "one_time_website" | "managed_website";

export type WebsiteStripePriceConfig = {
  type: WebsiteCheckoutType;
  mode: "payment" | "subscription";
  envKeys: string[];
};

export const websiteStripePrices: WebsiteStripePriceConfig[] = [
  {
    type: "one_time_website",
    mode: "payment",
    envKeys: ["NEXT_PUBLIC_STRIPE_WEBSITE_ONE_TIME_PRICE_ID"],
  },
  {
    type: "managed_website",
    mode: "subscription",
    envKeys: [
      "NEXT_PUBLIC_STRIPE_WEBSITE_SETUP_PRICE_ID",
      "NEXT_PUBLIC_STRIPE_WEBSITE_MANAGEMENT_MONTHLY_PRICE_ID",
    ],
  },
];

export function getWebsiteStripePriceConfig(type: WebsiteCheckoutType) {
  return websiteStripePrices.find((config) => config.type === type) ?? null;
}

export function getWebsiteStripePriceIds(type: WebsiteCheckoutType) {
  const config = getWebsiteStripePriceConfig(type);

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
