import QuoteFormPage from "@/components/quote-form-page";

export default function GutterCleaningQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Gutter Cleaning"
      title="Gutter Cleaning Quote"
      description="Estimate gutter cleaning, downspout clearing, and minor repair work."
      prefix="QGUT"
      defaultItem={{ description: "Gutter cleaning service", quantity: 1, price: 175 }}
      tips={["Note home stories and linear footage.", "Separate repairs from cleaning."]}
    />
  );
}
