import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getValidQuickBooksConnection,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";
import {
  getQuickBooksInvoice,
  getQuickBooksPaymentStatus,
} from "@/lib/quickbooks/invoices";
import type { QuickBooksRefreshInvoiceStatusRequest } from "@/lib/quickbooks/types";

export async function POST(req: Request) {
  try {
    const { user } = await requireQuickBooksUser();
    const body = (await req.json()) as Partial<QuickBooksRefreshInvoiceStatusRequest>;

    if (!body.invoiceId || !body.quickbooksInvoiceId) {
      return NextResponse.json(
        { error: "QuickBooks invoice ID is required." },
        { status: 400 }
      );
    }

    const connection = await getValidQuickBooksConnection(user.id);
    const quickBooksInvoice = await getQuickBooksInvoice(
      connection,
      body.quickbooksInvoiceId
    );
    const paymentStatus = getQuickBooksPaymentStatus(quickBooksInvoice);

    const supabaseAdmin = createSupabaseAdminClient();
    await supabaseAdmin.from("quickbooks_sync_history").upsert(
      {
        user_id: user.id,
        invoice_id: body.invoiceId,
        quickbooks_invoice_id: body.quickbooksInvoiceId,
        quickbooks_customer_id: quickBooksInvoice.CustomerRef?.value ?? null,
        sync_status: "status_refreshed",
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,invoice_id" }
    );

    return NextResponse.json({
      message:
        paymentStatus === "Paid"
          ? "QuickBooks shows this invoice as paid."
          : "QuickBooks status refreshed.",
      paymentStatus,
      quickbooks_balance: quickBooksInvoice.Balance ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not refresh QuickBooks status.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("requires Pro")
        ? 403
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
