"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import InvoicePaymentFields from "@/components/invoice-payment-fields";
import InvoiceSaveButton from "@/components/invoice-save-button";
import InvoiceStorageNote from "@/components/invoice-storage-note";
import {
  type InvoiceLineItem,
  type InvoiceRecord,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/invoices";
import { createInvoiceNumber, invoiceUi } from "@/lib/invoice-ui";
import type { ServiceCategory } from "@/lib/service-categories";

type Props = {
  category: ServiceCategory;
};

function cloneDefaultItems(category: ServiceCategory): InvoiceLineItem[] {
  return category.defaultLineItems.map((item) => ({ ...item }));
}

function buildEmptyDetails(category: ServiceCategory) {
  return Object.fromEntries(category.suggestedFields.map((field) => [field, ""]));
}

export default function ServiceInvoicePage({ category }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() =>
    createInvoiceNumber(category.invoicePrefix)
  );
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(category.name);
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Record<string, string>>(() =>
    buildEmptyDetails(category)
  );
  const [taxRate, setTaxRate] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [paidDate, setPaidDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>(() => cloneDefaultItems(category));

  const taxPercent = Number(taxRate) || 0;
  const depositAmount = Number(deposit) || 0;
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  );
  const taxAmount = useMemo(() => subtotal * (taxPercent / 100), [subtotal, taxPercent]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);
  const balanceDue = useMemo(
    () => Math.max(total - depositAmount, 0),
    [depositAmount, total]
  );

  function updateItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function removeItem(index: number) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next.length ? next : [{ description: "", quantity: 1, price: 0 }]);
  }

  function updateDetail(field: string, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function clearForm() {
    setInvoiceNumber(createInvoiceNumber(category.invoicePrefix));
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setProjectTitle(category.name);
    setNotes("");
    setDetails(buildEmptyDetails(category));
    setTaxRate("0");
    setDeposit("0");
    setPaymentStatus("Unpaid");
    setPaidDate("");
    setPaymentMethod("");
    setPaymentNotes("");
    setItems(cloneDefaultItems(category));
    setMessage("");
  }

  function buildInvoice(): InvoiceRecord | null {
    if (!customerName.trim() || !invoiceNumber.trim()) {
      alert("Please fill out the required fields.");
      return null;
    }

    return {
      id: crypto.randomUUID(),
      serviceType: category.name,
      invoiceNumber,
      customerName,
      phone,
      email,
      address,
      projectTitle,
      notes,
      items,
      subtotal,
      taxRate: taxPercent,
      taxAmount,
      deposit: depositAmount,
      total,
      balanceDue,
      paymentStatus,
      paidDate,
      paymentMethod,
      paymentNotes,
      createdAt: new Date().toISOString(),
      details,
    };
  }

  async function downloadPDF() {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`${invoiceNumber}.pdf`);
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <div className="mb-4 flex flex-wrap gap-4">
          <Link href="/invoices" className={invoiceUi.navLink}>
            Back to Invoices
          </Link>
          <Link href="/" className={invoiceUi.navLink}>
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className={invoiceUi.heroCard}>
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Service Invoice System
                </p>
                <h1 className="mt-2 text-3xl font-bold">{category.name} Invoice</h1>
                <p className="mt-2 text-slate-600">{category.description}</p>
              </div>
              <div className={invoiceUi.subtleBox}>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Invoice Number
                </p>
                <p className="text-lg font-bold">{invoiceNumber}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                className={invoiceUi.input}
              />
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer Name"
                className={invoiceUi.input}
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone"
                className={invoiceUi.input}
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className={invoiceUi.input}
              />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Service Address"
                className={invoiceUi.input}
              />
              <input
                value={projectTitle}
                onChange={(event) => setProjectTitle(event.target.value)}
                placeholder="Job Title"
                className={invoiceUi.input}
              />
              {category.suggestedFields.map((field) => (
                <input
                  key={field}
                  value={details[field] ?? ""}
                  onChange={(event) => updateDetail(field, event.target.value)}
                  placeholder={field}
                  className={invoiceUi.input}
                />
              ))}
            </div>

            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Line Items</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add labor, materials, fees, packages, and project add-ons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setItems([...items, { description: "", quantity: 1, price: 0 }])}
                  className="us-btn-primary px-5 py-3 text-sm"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 p-5">
                    <div className="grid gap-4 md:grid-cols-12">
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateItem(index, "description", event.target.value)
                        }
                        placeholder="Service item"
                        className={`${invoiceUi.input} md:col-span-12`}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", Number(event.target.value))
                        }
                        className={`${invoiceUi.input} md:col-span-3`}
                      />
                      <input
                        type="number"
                        value={item.price}
                        onChange={(event) =>
                          updateItem(index, "price", Number(event.target.value))
                        }
                        className={`${invoiceUi.input} md:col-span-4`}
                      />
                      <div className={`${invoiceUi.readonlyBox} md:col-span-3`}>
                        ${(item.quantity * item.price).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="us-btn-danger md:col-span-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input
                type="number"
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
                placeholder="Deposit"
                className={invoiceUi.input}
              />
              <input
                type="number"
                value={taxRate}
                onChange={(event) => setTaxRate(event.target.value)}
                placeholder="Tax Rate"
                className={invoiceUi.input}
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes"
                className={`${invoiceUi.textarea} md:col-span-2`}
              />
            </div>

            <InvoicePaymentFields
              paymentStatus={paymentStatus}
              paidDate={paidDate}
              paymentMethod={paymentMethod}
              paymentNotes={paymentNotes}
              onPaymentStatusChange={setPaymentStatus}
              onPaidDateChange={setPaidDate}
              onPaymentMethodChange={setPaymentMethod}
              onPaymentNotesChange={setPaymentNotes}
              inputClassName={invoiceUi.input}
              textareaClassName={invoiceUi.textarea}
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InvoiceSaveButton
                buildInvoice={buildInvoice}
                onSaved={() => {
                  setMessage(`${category.name} invoice saved.`);
                  setInvoiceNumber(createInvoiceNumber(category.invoicePrefix));
                }}
                className={invoiceUi.primaryButton}
              />
              <button type="button" onClick={downloadPDF} className={invoiceUi.secondaryButton}>
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={invoiceUi.successButton}
              >
                Print Invoice
              </button>
              <button type="button" onClick={clearForm} className={invoiceUi.mutedButton}>
                Clear Form
              </button>
            </div>

            <InvoiceStorageNote className="mt-6" />
            {message ? (
              <p className="mt-4 text-sm font-semibold text-[var(--color-success)]">
                {message}
              </p>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Invoice Totals</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deposit</span>
                  <span>-${depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 font-bold">
                  <span>Balance Due</span>
                  <span>${balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Pricing Tips</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {category.tips.map((tip) => (
                  <p key={tip}>{tip}</p>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
          <div
            ref={invoiceRef}
            className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 text-black"
          >
            <div className="flex justify-between border-b border-slate-300 pb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Invoice</p>
                <h2 className="mt-2 text-3xl font-bold">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-600">{projectTitle}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold">Invoice #</p>
                <p>{invoiceNumber}</p>
                <p className="mt-2 font-semibold">Date</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-500">Customer</p>
                <p className="mt-2 text-lg font-semibold">{customerName || "Customer name"}</p>
                <p className="mt-1">{phone || "Phone"}</p>
                <p className="mt-1">{email || "Email"}</p>
                <p className="mt-1">{address || "Service address"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Service Details</p>
                {category.suggestedFields.map((field) => (
                  <p key={field} className="mt-1">
                    {field}: {details[field] || "-"}
                  </p>
                ))}
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300">
              <table className="w-full text-left text-sm">
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      <td className="px-4 py-3">{item.description || "Service item"}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        ${(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-400 font-bold">
                    <td className="px-4 py-4" colSpan={3}>
                      Balance Due
                    </td>
                    <td className="px-4 py-4 text-right">${balanceDue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {notes ? <p className="mt-6 text-sm">{notes}</p> : null}
            {paymentNotes ? <p className="mt-3 text-sm">{paymentNotes}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
