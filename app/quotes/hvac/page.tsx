import { notFound } from "next/navigation";
import QuoteFormPage from "@/components/quote-form-page";
import { getServiceCategory } from "@/lib/service-categories";

export default function HvacQuotePage() {
  const category = getServiceCategory("hvac");
  if (!category) notFound();

  return (
    <QuoteFormPage
      quoteType={category.name}
      title={`${category.name} Quote`}
      description={category.description}
      prefix={category.quotePrefix}
      defaultItem={category.defaultLineItems[0]}
      defaultItems={category.defaultLineItems}
      tips={category.tips}
    />
  );
}
