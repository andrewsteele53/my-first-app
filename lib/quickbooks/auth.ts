import { createClient } from "@supabase/supabase-js";
import { getProfileAccess } from "@/lib/billing";
import { createClient as createUserSupabaseClient } from "@/lib/supabase/server";
import {
  getRequiredQuickBooksEnv,
  quickBooksTokenRequest,
} from "./client";
import type {
  QuickBooksConnection,
  QuickBooksTokenResponse,
} from "./types";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function requireQuickBooksUser() {
  const supabase = await createUserSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const access = await getProfileAccess(supabase, user);
  if (!access.hasProAccess) {
    throw new Error("QuickBooks integration requires Pro access.");
  }

  return { supabase, user, access };
}

function addSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function saveQuickBooksConnection(
  userId: string,
  realmId: string,
  tokens: QuickBooksTokenResponse
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const refreshExpiresAt = tokens.x_refresh_token_expires_in
    ? addSeconds(tokens.x_refresh_token_expires_in)
    : null;

  const { error } = await supabaseAdmin.from("quickbooks_connections").upsert({
    user_id: userId,
    realm_id: realmId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    access_token_expires_at: addSeconds(tokens.expires_in),
    refresh_token_expires_at: refreshExpiresAt,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getStoredQuickBooksConnection(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("quickbooks_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as QuickBooksConnection | null;
}

async function updateStoredTokens(
  supabaseAdmin: SupabaseAdminClient,
  userId: string,
  existing: QuickBooksConnection,
  tokens: QuickBooksTokenResponse
) {
  const refreshToken = tokens.refresh_token || existing.refresh_token;
  const refreshExpiresAt = tokens.x_refresh_token_expires_in
    ? addSeconds(tokens.x_refresh_token_expires_in)
    : existing.refresh_token_expires_at;

  const update = {
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    access_token_expires_at: addSeconds(tokens.expires_in),
    refresh_token_expires_at: refreshExpiresAt,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("quickbooks_connections")
    .update(update)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as QuickBooksConnection;
}

export async function getValidQuickBooksConnection(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("quickbooks_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const connection = data as QuickBooksConnection | null;
  if (!connection) {
    throw new Error("QuickBooks is not connected.");
  }

  const expiresAt = new Date(connection.access_token_expires_at).getTime();
  if (expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()) {
    return connection;
  }

  const tokens = (await quickBooksTokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    })
  )) as QuickBooksTokenResponse;

  return updateStoredTokens(supabaseAdmin, userId, connection, tokens);
}

export async function disconnectQuickBooks(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("quickbooks_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export function buildQuickBooksAuthorizationUrl(state: string) {
  const { clientId, redirectUri } = getRequiredQuickBooksEnv();
  const url = new URL("https://appcenter.intuit.com/connect/oauth2");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "com.intuit.quickbooks.accounting");
  url.searchParams.set("state", state);

  return url;
}
