import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Upgrade to Pro | Unified Steele",
  description:
    "Start a Unified Steele Pro trial and unlock core tools for invoices, quotes, leads, mapping, and operations.",
  path: "/subscribe",
});

export default function SubscribeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
