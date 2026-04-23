"use client";

import { INVOICE_STORAGE_NOTICE } from "@/lib/invoices";

type Props = {
  className?: string;
};

export default function InvoiceStorageNote({ className = "" }: Props) {
  return (
    <div
      className={`us-notice-warning text-sm ${className}`.trim()}
    >
      {INVOICE_STORAGE_NOTICE}
    </div>
  );
}
