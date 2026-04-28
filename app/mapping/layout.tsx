import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sales Mapping | Unified Steele",
  description:
    "Plan service territories, track field sales activity, and organize local opportunities with Unified Steele.",
  path: "/mapping",
});

export default function MappingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
