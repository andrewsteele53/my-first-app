import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Settings | Unified Steele",
  description:
    "Manage account, billing, subscription, and workspace settings for Unified Steele.",
  path: "/settings",
});

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
