import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { FREE_INVOICE_LIMIT } from "@/lib/free-invoice-limit";
import { getProfileAccess } from "@/lib/billing";

export async function GET() {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const access = await getProfileAccess(supabase, user);

    return NextResponse.json({
      isSubscribed: access.isSubscribed,
      subscriptionStatus: access.subscriptionStatus,
      used: access.freeInvoicesUsed,
      limit: FREE_INVOICE_LIMIT,
      remaining: access.freeInvoicesRemaining,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load free invoice status.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
