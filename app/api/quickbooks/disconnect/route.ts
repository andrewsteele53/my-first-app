import { NextResponse } from "next/server";
import {
  disconnectQuickBooks,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";

export async function POST() {
  try {
    const { user } = await requireQuickBooksUser();
    await disconnectQuickBooks(user.id);
    return NextResponse.json({ disconnected: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect QuickBooks.";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
