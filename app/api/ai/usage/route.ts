import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const AI_MONTHLY_LIMIT = 20;

export async function GET() {
  try {
    const supabase = await createClient();
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("ai_requests_used, ai_requests_reset_date")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile could not be read." },
        { status: 500 }
      );
    }

    const used = Number(profile.ai_requests_used ?? 0);
    const remaining = Math.max(AI_MONTHLY_LIMIT - used, 0);

    return NextResponse.json({
      used,
      limit: AI_MONTHLY_LIMIT,
      remaining,
      resetDate: profile.ai_requests_reset_date ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Usage check failed." },
      { status: 500 }
    );
  }
}
