import { redirect } from "next/navigation";
import SchedulingPageClient from "@/components/scheduling-page-client";
import { getBusinessProfile, getProfileIndustryLabel } from "@/lib/business-profile";
import { getProfileAccess } from "@/lib/billing";
import type { BookingRow } from "@/lib/scheduling";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata = createPageMetadata({
  title: "Scheduling | Unified Steele",
  description:
    "Manage appointments, booked jobs, estimates, consultations, and service calls with Unified Steele Scheduling.",
  path: "/scheduling",
});

export const dynamic = "force-dynamic";

export default async function SchedulingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getProfileAccess(supabase, user);

  if (!access.isActive) {
    redirect("/subscribe");
  }

  const businessProfile = await getBusinessProfile(supabase, user);
  const industryLabel = getProfileIndustryLabel(businessProfile);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", user.id)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <SchedulingPageClient
      userId={user.id}
      industryLabel={industryLabel}
      initialBookings={(data ?? []) as BookingRow[]}
    />
  );
}
