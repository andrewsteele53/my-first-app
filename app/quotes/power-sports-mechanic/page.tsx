import QuoteFormPage from "@/components/quote-form-page";

export default function PowerSportsMechanicQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Power Sports Mechanic"
      title="Power Sports Mechanic Quote"
      description="Estimate motorcycle, ATV, UTV, jet ski, and small engine work."
      prefix="QPSM"
      defaultItem={{ description: "Power sports diagnostic and repair labor", quantity: 1, price: 135 }}
      tips={["Note unit condition before work.", "Separate diagnostic, parts, and repair labor."]}
    />
  );
}
