import QuoteFormPage from "@/components/quote-form-page";

export default function CleaningQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Cleaning"
      title="Cleaning Quote"
      description="Estimate residential, commercial, deep cleaning, and add-on work."
      prefix="QCLEAN"
      defaultItem={{ description: "Cleaning service", quantity: 1, price: 200 }}
      tips={["Separate rooms, add-ons, or recurring work.", "Clarify supplies and access notes."]}
    />
  );
}
