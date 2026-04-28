import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Invoices | Unified Steele",
  description:
    "Create and manage professional service invoices for your business from Unified Steele.",
  path: "/invoices",
});

export default function InvoicesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
