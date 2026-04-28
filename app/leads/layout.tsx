import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Leads | Unified Steele",
  description:
    "Manage service business leads, follow-ups, customer details, and sales opportunities with Unified Steele.",
  path: "/leads",
});

export default function LeadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
