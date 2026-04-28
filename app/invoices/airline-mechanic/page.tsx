import MechanicInvoicePage from "@/components/mechanic-invoice-page";

export default function AirlineMechanicInvoicePage() {
  return (
    <MechanicInvoicePage
      serviceType="Airline Mechanic"
      title="Airline Mechanic Invoice"
      description="Create invoices for aviation maintenance, inspections, labor, and parts."
      prefix="AERO"
      defaultItem={{ description: "Aviation maintenance labor", quantity: 1, price: 250 }}
      detailLabels={["Aircraft", "Tail Number", "Work Order", "Inspection Type"]}
    />
  );
}
