import QuoteFormPage from "@/components/quote-form-page";

export default function LawnCareQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Lawn Care"
      title="Lawn Care Quote"
      description="Estimate mowing, edging, trimming, cleanup, and recurring service."
      prefix="QLAWN"
      defaultItem={{ description: "Lawn care service", quantity: 1, price: 85 }}
      tips={["Use notes for lot size and frequency.", "Separate cleanup, edging, and recurring visits."]}
    />
  );
}
