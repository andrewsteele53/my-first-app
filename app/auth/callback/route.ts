import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/billing";
import { getCurrentUserRole, getRoleHomePath } from "@/lib/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let redirectPath = "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await ensureProfile(supabase, user);
      const role = await getCurrentUserRole(supabase, user);
      redirectPath = getRoleHomePath(role);
    }
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
