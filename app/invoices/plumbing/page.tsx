import { notFound } from "next/navigation";
import ServiceInvoicePage from "@/components/service-invoice-page";
import { getServiceCategory } from "@/lib/service-categories";

export default function PlumbingInvoicePage() {
  const category = getServiceCategory("plumbing");
  if (!category) notFound();

  return <ServiceInvoicePage category={category} />;
}
