import { notFound } from "next/navigation";
import ServiceInvoicePage from "@/components/service-invoice-page";
import { getServiceCategory } from "@/lib/service-categories";

export default function LandscapingMaintenanceInvoicePage() {
  const category = getServiceCategory("landscaping-maintenance");
  if (!category) notFound();

  return <ServiceInvoicePage category={category} />;
}
