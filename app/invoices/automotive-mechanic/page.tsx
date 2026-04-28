import MechanicInvoicePage from "@/components/mechanic-invoice-page";

export default function AutomotiveMechanicInvoicePage() {
  return (
    <MechanicInvoicePage
      serviceType="Automotive Mechanic"
      title="Automotive Mechanic Invoice"
      description="Create invoices for diagnostics, labor, parts, repair work, and maintenance."
      prefix="AUTO"
      defaultItem={{ description: "Automotive diagnostic and labor", quantity: 1, price: 150 }}
      detailLabels={["Vehicle", "VIN", "Mileage", "Repair Order"]}
    />
  );
}
