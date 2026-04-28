import { notFound } from "next/navigation";
import ServiceInvoicePage from "@/components/service-invoice-page";
import { getServiceCategory } from "@/lib/service-categories";

export default function RoofingInvoicePage() {
  const category = getServiceCategory("roofing");
  if (!category) notFound();

  return <ServiceInvoicePage category={category} />;
}
