import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers | Unified Steele",
  description: "Store customer information, sales status, and follow-up notes.",
};

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
