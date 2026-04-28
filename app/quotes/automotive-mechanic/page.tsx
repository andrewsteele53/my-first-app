import QuoteFormPage from "@/components/quote-form-page";

export default function AutomotiveMechanicQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Automotive Mechanic"
      title="Automotive Mechanic Quote"
      description="Estimate diagnostics, parts, shop labor, and automotive repair work."
      prefix="QAUTO"
      defaultItem={{ description: "Automotive diagnostic and labor", quantity: 1, price: 150 }}
      tips={["List parts separately from labor.", "Use notes for exclusions and approval terms."]}
    />
  );
}
