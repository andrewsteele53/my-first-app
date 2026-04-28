import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Saved Quotes | Unified Steele",
  description:
    "Track saved quotes, customer estimates, and quote-to-invoice workflows in Unified Steele.",
  path: "/quotes/saved",
});

export default function SavedQuotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
