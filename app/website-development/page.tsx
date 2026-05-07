import WebsiteDevelopmentPage from "@/components/website-development-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Website Development | Unified Steele",
  description:
    "Professional website development services for businesses across all industries, with one-time builds and optional recurring website management.",
  path: "/website-development",
});

export default function Page() {
  return <WebsiteDevelopmentPage />;
}
