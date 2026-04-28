import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Trash | Unified Steele",
  description:
    "Restore or manage deleted quote records in your Unified Steele workspace.",
  path: "/quotes/trash",
});

export default function QuoteTrashLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
