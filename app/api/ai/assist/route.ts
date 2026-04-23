import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { generateAIAssistance } from "@/lib/ai/assistant";
import { validateAIAssistRequest } from "@/lib/ai/schemas";
import { getProfileAccess } from "@/lib/billing";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const access = await getProfileAccess(supabase, user);

    if (!access.isSubscribed) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI features are available on the paid plan only.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    const validated = validateAIAssistRequest(body);

    if (!validated.ok) {
      return NextResponse.json(
        { ok: false, error: validated.error },
        { status: 400 }
      );
    }

    const result = await generateAIAssistance(validated.data);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI request failed.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
