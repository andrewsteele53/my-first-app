import QuoteFormPage from "@/components/quote-form-page";

export default function PowerwashingQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Power Washing"
      title="Power Washing Quote"
      description="Estimate driveways, siding, patios, decks, and exterior washing."
      prefix="QWASH"
      defaultItem={{ description: "Power washing service", quantity: 1, price: 225 }}
      tips={["Note square footage or surface type.", "Separate chemical treatment or add-ons."]}
    />
  );
}
