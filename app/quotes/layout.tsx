import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Quotes | Unified Steele",
  description:
    "Create, track, and convert professional service quotes with Unified Steele.",
  path: "/quotes",
});

export default function QuotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
