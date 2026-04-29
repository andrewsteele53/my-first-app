import type { InvoiceRecord } from "@/lib/invoices";
import { quickBooksApiFetch, quickBooksQuery } from "./client";
import type {
  QuickBooksAccount,
  QuickBooksConnection,
  QuickBooksInvoice,
  QuickBooksItem,
} from "./types";

type ItemQueryResponse = {
  QueryResponse?: {
    Item?: QuickBooksItem[];
  };
};

type AccountQueryResponse = {
  QueryResponse?: {
    Account?: QuickBooksAccount[];
  };
};

type ItemCreateResponse = {
  Item?: QuickBooksItem;
};

type InvoiceCreateResponse = {
  Invoice?: QuickBooksInvoice;
};

type InvoiceReadResponse = {
  Invoice?: QuickBooksInvoice;
};

type PaymentCreateResponse = {
  Payment?: {
    Id: string;
  };
};

const SERVICE_ITEM_NAME = "Unified Steele Services";
const TAX_ITEM_NAME = "Unified Steele Tax";
const DEPOSIT_ITEM_NAME = "Unified Steele Deposit Credit";

function escapeSql(value: string) {
  return value.replace(/'/g, "\\'");
}

async function getIncomeAccount(connection: QuickBooksConnection) {
  const data = await quickBooksQuery<AccountQueryResponse>(
    connection,
    "select * from Account where AccountType = 'Income' maxresults 1"
  );

  const account = data.QueryResponse?.Account?.[0];
  if (!account?.Id) {
    throw new Error("No QuickBooks income account found for invoice items.");
  }

  return account;
}

async function findItem(connection: QuickBooksConnection, name: string) {
  const data = await quickBooksQuery<ItemQueryResponse>(
    connection,
    `select * from Item where Name = '${escapeSql(name)}' maxresults 1`
  );

  return data.QueryResponse?.Item?.[0] ?? null;
}

async function getOrCreateServiceItem(
  connection: QuickBooksConnection,
  name = SERVICE_ITEM_NAME
) {
  const existing = await findItem(connection, name);
  if (existing?.Id) return existing;

  const incomeAccount = await getIncomeAccount(connection);
  const data = await quickBooksApiFetch<ItemCreateResponse>(
    connection,
    "/item",
    {
      method: "POST",
      body: JSON.stringify({
        Name: name,
        Type: "Service",
        IncomeAccountRef: {
          value: incomeAccount.Id,
        },
      }),
    }
  );

  if (!data.Item?.Id) {
    throw new Error("QuickBooks service item creation did not return an ID.");
  }

  return data.Item;
}

function buildInvoiceLines(
  invoice: InvoiceRecord,
  serviceItemId: string,
  taxItemId: string,
  depositItemId: string
) {
  const itemLines = invoice.items.length
    ? invoice.items
    : [
        {
          description: invoice.projectTitle || invoice.serviceType || "Service",
          quantity: 1,
          price: invoice.subtotal || invoice.total || 0,
        },
      ];

  const lines = itemLines.map((item) => ({
    DetailType: "SalesItemLineDetail",
    Description: item.description || invoice.serviceType || "Service",
    Amount: Number((Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)),
    SalesItemLineDetail: {
      ItemRef: {
        value: serviceItemId,
      },
      Qty: Number(item.quantity || 0) || 1,
      UnitPrice: Number(item.price || 0),
    },
  }));

  if (invoice.taxAmount > 0) {
    lines.push({
      DetailType: "SalesItemLineDetail",
      Description: "Tax",
      Amount: Number(invoice.taxAmount.toFixed(2)),
      SalesItemLineDetail: {
        ItemRef: {
          value: taxItemId,
        },
        Qty: 1,
        UnitPrice: Number(invoice.taxAmount.toFixed(2)),
      },
    });
  }

  if (invoice.deposit > 0) {
    lines.push({
      DetailType: "SalesItemLineDetail",
      Description: "Deposit / credit recorded in Unified Steele",
      Amount: -Number(invoice.deposit.toFixed(2)),
      SalesItemLineDetail: {
        ItemRef: {
          value: depositItemId,
        },
        Qty: 1,
        UnitPrice: -Number(invoice.deposit.toFixed(2)),
      },
    });
  }

  return lines;
}

export async function createQuickBooksInvoice(
  connection: QuickBooksConnection,
  invoice: InvoiceRecord,
  quickbooksCustomerId: string
) {
  const [serviceItem, taxItem, depositItem] = await Promise.all([
    getOrCreateServiceItem(connection, SERVICE_ITEM_NAME),
    getOrCreateServiceItem(connection, TAX_ITEM_NAME),
    getOrCreateServiceItem(connection, DEPOSIT_ITEM_NAME),
  ]);

  const payload = {
    CustomerRef: {
      value: quickbooksCustomerId,
    },
    DocNumber: invoice.invoiceNumber || undefined,
    TxnDate: invoice.createdAt
      ? new Date(invoice.createdAt).toISOString().slice(0, 10)
      : undefined,
    PrivateNote: invoice.notes || undefined,
    Line: buildInvoiceLines(
      invoice,
      serviceItem.Id,
      taxItem.Id,
      depositItem.Id
    ),
  };

  const data = await quickBooksApiFetch<InvoiceCreateResponse>(
    connection,
    "/invoice",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!data.Invoice?.Id) {
    throw new Error("QuickBooks invoice creation did not return an ID.");
  }

  return data.Invoice;
}

export async function getQuickBooksInvoice(
  connection: QuickBooksConnection,
  quickbooksInvoiceId: string
) {
  const data = await quickBooksApiFetch<InvoiceReadResponse>(
    connection,
    `/invoice/${quickbooksInvoiceId}`
  );

  if (!data.Invoice?.Id) {
    throw new Error("QuickBooks invoice was not found.");
  }

  return data.Invoice;
}

export async function createQuickBooksPaymentForPaidInvoice(
  connection: QuickBooksConnection,
  invoice: InvoiceRecord,
  quickbooksInvoice: QuickBooksInvoice,
  quickbooksCustomerId: string
) {
  if (invoice.paymentStatus !== "Paid") return null;

  const totalAmount = Number(quickbooksInvoice.TotalAmt || invoice.total || 0);
  if (totalAmount <= 0) return null;

  const data = await quickBooksApiFetch<PaymentCreateResponse>(
    connection,
    "/payment",
    {
      method: "POST",
      body: JSON.stringify({
        CustomerRef: {
          value: quickbooksCustomerId,
        },
        TotalAmt: Number(totalAmount.toFixed(2)),
        TxnDate: invoice.paidDate
          ? new Date(invoice.paidDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        PrivateNote: invoice.paymentNotes || "Payment recorded in Unified Steele.",
        Line: [
          {
            Amount: Number(totalAmount.toFixed(2)),
            LinkedTxn: [
              {
                TxnId: quickbooksInvoice.Id,
                TxnType: "Invoice",
              },
            ],
          },
        ],
      }),
    }
  );

  return data.Payment ?? null;
}

export function getQuickBooksPaymentStatus(invoice: QuickBooksInvoice) {
  return Number(invoice.Balance || 0) <= 0 ? "Paid" : "Unpaid";
}
