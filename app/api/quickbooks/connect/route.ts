import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildQuickBooksAuthorizationUrl,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";

const STATE_COOKIE = "quickbooks_oauth_state";

export async function GET() {
  try {
    await requireQuickBooksUser();

    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });

    return NextResponse.redirect(buildQuickBooksAuthorizationUrl(state));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not connect QuickBooks.";
    return NextResponse.redirect(
      new URL(`/settings?quickbooks_error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    );
  }
}
