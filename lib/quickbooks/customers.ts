import type { InvoiceRecord } from "@/lib/invoices";
import { quickBooksApiFetch, quickBooksQuery } from "./client";
import type { QuickBooksConnection, QuickBooksCustomer } from "./types";

type CustomerQueryResponse = {
  QueryResponse?: {
    Customer?: QuickBooksCustomer[];
  };
};

type CustomerCreateResponse = {
  Customer?: QuickBooksCustomer;
};

function escapeSql(value: string) {
  return value.replace(/'/g, "\\'");
}

function getDisplayName(invoice: InvoiceRecord) {
  return (
    invoice.customerName ||
    invoice.email ||
    invoice.phone ||
    `Customer ${invoice.invoiceNumber || invoice.id}`
  ).trim();
}

export async function findQuickBooksCustomerByEmail(
  connection: QuickBooksConnection,
  email: string
) {
  const query = `select * from Customer where PrimaryEmailAddr = '${escapeSql(
    email
  )}' maxresults 1`;
  const data = await quickBooksQuery<CustomerQueryResponse>(connection, query);
  return data.QueryResponse?.Customer?.[0] ?? null;
}

export async function findQuickBooksCustomerByDisplayName(
  connection: QuickBooksConnection,
  displayName: string
) {
  const query = `select * from Customer where DisplayName = '${escapeSql(
    displayName
  )}' maxresults 1`;
  const data = await quickBooksQuery<CustomerQueryResponse>(connection, query);
  return data.QueryResponse?.Customer?.[0] ?? null;
}

export async function createQuickBooksCustomer(
  connection: QuickBooksConnection,
  invoice: InvoiceRecord
) {
  const displayName = getDisplayName(invoice);
  const payload: Record<string, unknown> = {
    DisplayName: displayName,
    GivenName: invoice.customerName || displayName,
  };

  if (invoice.email) {
    payload.PrimaryEmailAddr = { Address: invoice.email };
  }

  if (invoice.phone) {
    payload.PrimaryPhone = { FreeFormNumber: invoice.phone };
  }

  if (invoice.address) {
    payload.BillAddr = { Line1: invoice.address };
  }

  const data = await quickBooksApiFetch<CustomerCreateResponse>(
    connection,
    "/customer",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!data.Customer?.Id) {
    throw new Error("QuickBooks customer creation did not return an ID.");
  }

  return data.Customer;
}

export async function getOrCreateQuickBooksCustomer(
  connection: QuickBooksConnection,
  invoice: InvoiceRecord
) {
  const displayName = getDisplayName(invoice);

  if (invoice.email) {
    const byEmail = await findQuickBooksCustomerByEmail(connection, invoice.email);
    if (byEmail) return byEmail;
  }

  const byName = await findQuickBooksCustomerByDisplayName(
    connection,
    displayName
  );
  if (byName) return byName;

  return createQuickBooksCustomer(connection, invoice);
}
