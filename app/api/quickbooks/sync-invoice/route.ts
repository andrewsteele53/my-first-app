import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getValidQuickBooksConnection,
  requireQuickBooksUser,
} from "@/lib/quickbooks/auth";
import { getOrCreateQuickBooksCustomer } from "@/lib/quickbooks/customers";
import {
  createQuickBooksInvoice,
  createQuickBooksPaymentForPaidInvoice,
} from "@/lib/quickbooks/invoices";
import type { QuickBooksSyncInvoiceRequest } from "@/lib/quickbooks/types";

async function recordSyncHistory(input: {
  userId: string;
  invoiceId: string;
  quickbooksInvoiceId?: string | null;
  quickbooksCustomerId?: string | null;
  syncStatus: string;
  lastError?: string | null;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  await supabaseAdmin.from("quickbooks_sync_history").upsert(
    {
      user_id: input.userId,
      invoice_id: input.invoiceId,
      quickbooks_invoice_id: input.quickbooksInvoiceId ?? null,
      quickbooks_customer_id: input.quickbooksCustomerId ?? null,
      sync_status: input.syncStatus,
      last_error: input.lastError ?? null,
      synced_at:
        input.syncStatus === "synced" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,invoice_id" }
  );
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let invoiceId: string | null = null;

  try {
    const { user } = await requireQuickBooksUser();
    userId = user.id;
    const body = (await req.json()) as Partial<QuickBooksSyncInvoiceRequest>;
    const invoice = body.invoice;
    invoiceId = invoice?.id ?? null;

    if (!invoice?.id) {
      return NextResponse.json(
        { error: "Invoice details are required." },
        { status: 400 }
      );
    }

    if (invoice.quickbooks_invoice_id) {
      await recordSyncHistory({
        userId: user.id,
        invoiceId: invoice.id,
        quickbooksInvoiceId: invoice.quickbooks_invoice_id,
        quickbooksCustomerId: invoice.quickbooks_customer_id ?? null,
        syncStatus: "already_synced",
      });

      return NextResponse.json({
        alreadySynced: true,
        message: "Already synced.",
        quickbooks_invoice_id: invoice.quickbooks_invoice_id,
        quickbooks_customer_id: invoice.quickbooks_customer_id ?? null,
      });
    }

    const connection = await getValidQuickBooksConnection(user.id);
    const customer = await getOrCreateQuickBooksCustomer(connection, invoice);
    const quickBooksInvoice = await createQuickBooksInvoice(
      connection,
      invoice,
      customer.Id
    );
    await createQuickBooksPaymentForPaidInvoice(
      connection,
      invoice,
      quickBooksInvoice,
      customer.Id
    );

    await recordSyncHistory({
      userId: user.id,
      invoiceId: invoice.id,
      quickbooksInvoiceId: quickBooksInvoice.Id,
      quickbooksCustomerId: customer.Id,
      syncStatus: "synced",
    });

    return NextResponse.json({
      message: "Sync successful.",
      quickbooks_invoice_id: quickBooksInvoice.Id,
      quickbooks_customer_id: customer.Id,
      quickbooks_sync_status: "synced",
      quickbooks_synced_at: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invoice sync failed.";

    if (userId && invoiceId) {
      await recordSyncHistory({
        userId,
        invoiceId,
        syncStatus: "failed",
        lastError: message,
      }).catch(() => undefined);
    }

    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("requires Pro")
        ? 403
        : 500;
    return NextResponse.json(
      { error: `Sync failed: ${message}` },
      { status }
    );
  }
}
