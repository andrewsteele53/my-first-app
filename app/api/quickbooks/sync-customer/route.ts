import { NextResponse } from "next/server";
import {
  getValidQuickBooksConnection,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";
import { getOrCreateQuickBooksCustomer } from "@/lib/quickbooks/customers";
import type { QuickBooksSyncInvoiceRequest } from "@/lib/quickbooks/types";

export async function POST(req: Request) {
  try {
    const { user } = await requireQuickBooksUser();
    const body = (await req.json()) as Partial<QuickBooksSyncInvoiceRequest>;

    if (!body.invoice) {
      return NextResponse.json(
        { error: "Invoice details are required." },
        { status: 400 }
      );
    }

    const connection = await getValidQuickBooksConnection(user.id);
    const customer = await getOrCreateQuickBooksCustomer(
      connection,
      body.invoice
    );

    return NextResponse.json({
      quickbooks_customer_id: customer.Id,
      message: "Customer synced successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Customer sync failed.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("requires Pro")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
