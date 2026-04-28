import QuoteFormPage from "@/components/quote-form-page";

export default function CarDetailingQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Car Detailing"
      title="Car Detailing Quote"
      description="Estimate interior, exterior, full details, and package add-ons."
      prefix="QDETAIL"
      defaultItem={{ description: "Full detail package", quantity: 1, price: 250 }}
      tips={["Note vehicle size and condition.", "Separate interior, exterior, and add-ons."]}
    />
  );
}
