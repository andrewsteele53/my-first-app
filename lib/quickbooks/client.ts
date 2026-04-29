import type { QuickBooksConnection, QuickBooksEnvironment } from "./types";

export const QUICKBOOKS_MINOR_VERSION = "75";

export function getQuickBooksEnvironment(): QuickBooksEnvironment {
  return process.env.QUICKBOOKS_ENVIRONMENT === "sandbox"
    ? "sandbox"
    : "production";
}

export function getQuickBooksApiBaseUrl() {
  return getQuickBooksEnvironment() === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

export function getQuickBooksAuthorizeUrl() {
  return "https://appcenter.intuit.com/connect/oauth2";
}

export function getQuickBooksTokenUrl() {
  return "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
}

export function getRequiredQuickBooksEnv() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("QuickBooks environment variables are not configured.");
  }

  return { clientId, clientSecret, redirectUri };
}

function getAuthorizationHeader() {
  const { clientId, clientSecret } = getRequiredQuickBooksEnv();
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${encoded}`;
}

export async function quickBooksTokenRequest(body: URLSearchParams) {
  const response = await fetch(getQuickBooksTokenUrl(), {
    method: "POST",
    headers: {
      Authorization: getAuthorizationHeader(),
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data?.error_description === "string"
        ? data.error_description
        : typeof data?.error === "string"
        ? data.error
        : "QuickBooks token request failed.";
    throw new Error(message);
  }

  return data;
}

export async function quickBooksApiFetch<T>(
  connection: Pick<QuickBooksConnection, "realm_id" | "access_token">,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${getQuickBooksApiBaseUrl()}/v3/company/${connection.realm_id}${path}${separator}minorversion=${QUICKBOOKS_MINOR_VERSION}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${connection.access_token}`,
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const faultError = data?.Fault?.Error?.[0];
    const message =
      faultError?.Detail ||
      faultError?.Message ||
      data?.Fault?.Error?.[0]?.code ||
      "QuickBooks API request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function quickBooksQuery<T>(
  connection: Pick<QuickBooksConnection, "realm_id" | "access_token">,
  query: string
): Promise<T> {
  return quickBooksApiFetch<T>(
    connection,
    `/query?query=${encodeURIComponent(query)}`
  );
}
