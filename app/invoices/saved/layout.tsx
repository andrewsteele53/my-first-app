import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Saved Invoices | Unified Steele",
  description:
    "Review and manage saved service invoices in your Unified Steele workspace.",
  path: "/invoices/saved",
});

export default function SavedInvoicesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
