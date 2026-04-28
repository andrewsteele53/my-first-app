import QuoteFormPage from "@/components/quote-form-page";

export default function HandymanQuotePage() {
  return (
    <QuoteFormPage
      quoteType="Handyman"
      title="Handyman Quote"
      description="Estimate repairs, installs, maintenance, and small project work."
      prefix="QHANDY"
      defaultItem={{ description: "General handyman labor", quantity: 1, price: 125 }}
      tips={["Use line items for each task.", "Add notes for customer-provided materials."]}
    />
  );
}
