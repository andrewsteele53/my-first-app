import { NextResponse } from "next/server";
import {
  getStoredQuickBooksConnection,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";

export async function GET() {
  try {
    const { user } = await requireQuickBooksUser();
    const connection = await getStoredQuickBooksConnection(user.id);

    return NextResponse.json({
      connected: Boolean(connection),
      realmId: connection?.realm_id ?? null,
      connectedAt: connection?.connected_at ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not load QuickBooks status.";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
