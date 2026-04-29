import type { InvoiceRecord } from "@/lib/invoices";

export type QuickBooksEnvironment = "production" | "sandbox";

export type QuickBooksConnection = {
  user_id: string;
  realm_id: string;
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string | null;
  connected_at: string;
  updated_at: string;
};

export type QuickBooksTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in?: number;
  token_type: string;
};

export type QuickBooksCustomer = {
  Id: string;
  DisplayName?: string;
  PrimaryEmailAddr?: {
    Address?: string;
  };
};

export type QuickBooksInvoice = {
  Id: string;
  Balance?: number;
  TotalAmt?: number;
  CustomerRef?: {
    value?: string;
  };
};

export type QuickBooksItem = {
  Id: string;
  Name?: string;
};

export type QuickBooksAccount = {
  Id: string;
  Name?: string;
  AccountType?: string;
};

export type QuickBooksSyncInvoiceRequest = {
  invoice: InvoiceRecord;
};

export type QuickBooksRefreshInvoiceStatusRequest = {
  invoiceId: string;
  quickbooksInvoiceId: string;
};
