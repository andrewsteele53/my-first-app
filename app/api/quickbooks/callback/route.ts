import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  requireQuickBooksUser,
  saveQuickBooksConnection,
} from "@/lib/quickbooks/auth";
import {
  getRequiredQuickBooksEnv,
  quickBooksTokenRequest,
} from "@/lib/quickbooks/client";
import type { QuickBooksTokenResponse } from "@/lib/quickbooks/types";

const STATE_COOKIE = "quickbooks_oauth_state";

function redirectToSettings(request: NextRequest, params: Record<string, string>) {
  const url = new URL("/settings", request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  try {
    const { user } = await requireQuickBooksUser();
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");
    const state = searchParams.get("state");
    const expectedState = cookieStore.get(STATE_COOKIE)?.value;

    cookieStore.delete(STATE_COOKIE);

    if (!code || !realmId || !state || !expectedState || state !== expectedState) {
      return redirectToSettings(request, {
        quickbooks_error: "QuickBooks connection could not be verified.",
      });
    }

    const { redirectUri } = getRequiredQuickBooksEnv();
    const tokens = (await quickBooksTokenRequest(
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      })
    )) as QuickBooksTokenResponse;

    await saveQuickBooksConnection(user.id, realmId, tokens);

    return redirectToSettings(request, { quickbooks_connected: "1" });
  } catch (error) {
    cookieStore.delete(STATE_COOKIE);
    const message =
      error instanceof Error ? error.message : "QuickBooks connection failed.";
    return redirectToSettings(request, {
      quickbooks_error: message,
    });
  }
}
