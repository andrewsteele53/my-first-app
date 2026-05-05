import { redirect } from "next/navigation";
import type { AuthUser, SupabaseClient } from "@supabase/supabase-js";
import { ensureProfile } from "@/lib/billing";

export const ACCOUNT_ROLES = ["admin", "sales", "subscriber"] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

type RoleSupabaseClient = Pick<SupabaseClient, "from">;
type RoleUser = Pick<AuthUser, "id" | "email">;

export function normalizeAccountRole(value?: string | null): AccountRole {
  return value === "admin" || value === "sales" ? value : "subscriber";
}

export function getRoleHomePath(role: AccountRole) {
  if (role === "admin") return "/admin";
  if (role === "sales") return "/sales";
  return "/";
}

export async function getCurrentUserRole(
  supabase: RoleSupabaseClient,
  user: RoleUser
): Promise<AccountRole> {
  await ensureProfile(supabase, user);

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeAccountRole(
    data && typeof data.role === "string" ? data.role : null
  );
}

export async function requireAccountRole(
  supabase: RoleSupabaseClient,
  user: RoleUser | null | undefined,
  allowedRoles: AccountRole[]
) {
  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole(supabase, user);

  if (!allowedRoles.includes(role)) {
    redirect(getRoleHomePath(role));
  }

  return role;
}

export async function requireAdmin(
  supabase: RoleSupabaseClient,
  user: RoleUser | null | undefined
) {
  return requireAccountRole(supabase, user, ["admin"]);
}
