import QuoteFormPage from "@/components/quote-form-page";

export default function ConstructionQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Construction"
      title="Construction Quote"
      description="Estimate project scope, labor, materials, phases, and add-ons."
      prefix="QCONST"
      defaultItem={{ description: "Construction labor", quantity: 1, price: 500 }}
      tips={["Break large projects into phases.", "Call out deposits, materials, and exclusions."]}
    />
  );
}
