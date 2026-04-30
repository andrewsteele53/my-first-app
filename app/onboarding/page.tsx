import { redirect } from "next/navigation";
import BusinessProfileForm from "@/components/business-profile-form";
import { getBusinessProfile } from "@/lib/business-profile";
import { createClient } from "@/lib/supabase/server";

function getAuthMetadataName(user: {
  user_metadata?: Record<string, unknown>;
}) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return "";
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getBusinessProfile(supabase, user);

  if (profile?.onboarding_completed) {
    redirect("/");
  }

  return (
    <main className="us-page">
      <div className="us-shell py-8">
        <section className="us-hero">
          <div className="max-w-3xl">
            <p className="us-kicker">Business Setup</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">
              Personalize Unified Steele for your business.
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--color-text-secondary)]">
              Tell us what kind of service business you run. We&apos;ll use it
              to default your quote, invoice, dashboard, and AI experience.
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[1.8rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] md:p-8">
          <BusinessProfileForm
            initialProfile={profile}
            initialOwnerName={getAuthMetadataName(user)}
            mode="onboarding"
          />
        </section>
      </div>
    </main>
  );
}
