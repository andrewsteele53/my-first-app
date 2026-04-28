import MechanicInvoicePage from "@/components/mechanic-invoice-page";

export default function PowerSportsMechanicInvoicePage() {
  return (
    <MechanicInvoicePage
      serviceType="Power Sports Mechanic"
      title="Power Sports Mechanic Invoice"
      description="Create invoices for motorcycles, ATVs, UTVs, jet skis, and small engine repairs."
      prefix="PSM"
      defaultItem={{ description: "Power sports diagnostic and repair labor", quantity: 1, price: 135 }}
      detailLabels={["Unit", "VIN/HIN", "Mileage/Hours", "Repair Type"]}
    />
  );
}
