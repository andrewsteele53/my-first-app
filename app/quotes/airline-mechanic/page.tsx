import QuoteFormPage from "@/components/quote-form-page";

export default function AirlineMechanicQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Airline Mechanic"
      title="Airline Mechanic Quote"
      description="Estimate aviation maintenance, inspections, parts, and mechanic labor."
      prefix="QAERO"
      defaultItem={{ description: "Aviation maintenance labor", quantity: 1, price: 250 }}
      tips={["Document inspection scope clearly.", "Separate parts, compliance checks, and labor."]}
    />
  );
}
