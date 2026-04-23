import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/billing";
import { FREE_INVOICE_LIMIT } from "@/lib/free-invoice-limit";

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for free invoice usage."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST() {
  try {
    const supabase = await createSupabaseClient();
    const supabaseAdmin = createSupabaseAdminClient();

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

    await ensureProfile(supabase, user);

    const { data, error } = await supabaseAdmin.rpc("consume_free_invoice", {
      p_user_id: user.id,
    });

    if (error) {
      return NextResponse.json(
        {
          error:
            "Could not update free invoice usage. Make sure the Supabase migration for consume_free_invoice has been applied.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data?.ok) {
      if (data?.reason === "limit_reached") {
        return NextResponse.json(
          {
            error: "You have reached your 5 free invoices. Subscribe to continue.",
            used: data.used ?? FREE_INVOICE_LIMIT,
            remaining: 0,
            limit: data.limit ?? FREE_INVOICE_LIMIT,
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        { error: "Could not consume invoice usage." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update free invoice usage.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
