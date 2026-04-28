import { NextResponse } from "next/server";
import { getProfileAccess } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const access = await getProfileAccess(supabase, user);

    return NextResponse.json(access);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load billing access.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
