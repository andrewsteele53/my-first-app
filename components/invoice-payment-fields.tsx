"use client";

import type { PaymentMethod, PaymentStatus } from "@/lib/invoices";

type Props = {
  paymentStatus: PaymentStatus;
  paidDate: string;
  paymentMethod: PaymentMethod | "";
  paymentNotes: string;
  onPaymentStatusChange: (value: PaymentStatus) => void;
  onPaidDateChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod | "") => void;
  onPaymentNotesChange: (value: string) => void;
  inputClassName: string;
  textareaClassName: string;
};

export default function InvoicePaymentFields({
  paymentStatus,
  paidDate,
  paymentMethod,
  paymentNotes,
  onPaymentStatusChange,
  onPaidDateChange,
  onPaymentMethodChange,
  onPaymentNotesChange,
  inputClassName,
  textareaClassName,
}: Props) {
  return (
    <section className="mt-8 rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Payment Tracking
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            Track invoice payment details
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          Keep payment status and collection notes with the invoice so saved
          records are more useful later.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(event) =>
              onPaymentStatusChange(event.target.value as PaymentStatus)
            }
            className={inputClassName}
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Paid Date</label>
          <input
            type="date"
            value={paidDate}
            onChange={(event) => onPaidDateChange(event.target.value)}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as PaymentMethod | "")
            }
            className={inputClassName}
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold">
            Payment Notes
          </label>
          <textarea
            value={paymentNotes}
            onChange={(event) => onPaymentNotesChange(event.target.value)}
            placeholder="Optional payment notes, check number, or collection context..."
            className={textareaClassName}
          />
        </div>
      </div>
    </section>
  );
}
