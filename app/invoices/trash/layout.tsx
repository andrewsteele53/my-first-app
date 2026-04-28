import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Trash | Unified Steele",
  description:
    "Restore or manage deleted invoice records in your Unified Steele workspace.",
  path: "/invoices/trash",
});

export default function InvoiceTrashLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
