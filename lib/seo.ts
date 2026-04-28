import type { Metadata } from "next";

export const siteUrl = "https://unifiedsteele.app";
export const siteName = "Unified Steele";
export const siteTitle = "Unified Steele | Business Management App";
export const siteDescription =
  "Unified Steele helps service businesses manage invoices, quotes, leads, scheduling, and business operations from one clean dashboard.";
export const siteDescriptionWithTagline = `${siteDescription} Your business. Unified.`;

type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
};

export function createPageMetadata({
  title,
  description,
  path = "/",
}: PageMetadataInput): Metadata {
  const url = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
