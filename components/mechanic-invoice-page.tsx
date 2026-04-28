"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceSaveButton from "@/components/invoice-save-button";
import InvoiceStorageNote from "@/components/invoice-storage-note";
import InvoicePaymentFields from "@/components/invoice-payment-fields";
import {
  type InvoiceLineItem,
  type InvoiceRecord,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/invoices";
import { createInvoiceNumber, invoiceUi } from "@/lib/invoice-ui";

type Props = {
  serviceType: string;
  title: string;
  description: string;
  prefix: string;
  defaultItem: InvoiceLineItem;
  detailLabels: [string, string, string, string];
};

export default function MechanicInvoicePage({
  serviceType,
  title,
  description,
  prefix,
  defaultItem,
  detailLabels,
}: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(() => createInvoiceNumber(prefix));
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(serviceType);
  const [notes, setNotes] = useState("");
  const [detailOne, setDetailOne] = useState("");
  const [detailTwo, setDetailTwo] = useState("");
  const [detailThree, setDetailThree] = useState("");
  const [detailFour, setDetailFour] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("Unpaid");
  const [paidDate, setPaidDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([defaultItem]);

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
    [total, depositAmount]
  );

  function updateItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function clearForm() {
    setInvoiceNumber(createInvoiceNumber(prefix));
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setProjectTitle(serviceType);
    setNotes("");
    setDetailOne("");
    setDetailTwo("");
    setDetailThree("");
    setDetailFour("");
    setTaxRate("0");
    setDeposit("0");
    setPaymentStatus("Unpaid");
    setPaidDate("");
    setPaymentMethod("");
    setPaymentNotes("");
    setItems([defaultItem]);
    setMessage("");
  }

  function buildInvoice(): InvoiceRecord | null {
    if (!customerName.trim() || !invoiceNumber.trim()) {
      alert("Please fill out the required fields.");
      return null;
    }

    return {
      id: crypto.randomUUID(),
      serviceType,
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
      details: {
        [detailLabels[0]]: detailOne,
        [detailLabels[1]]: detailTwo,
        [detailLabels[2]]: detailThree,
        [detailLabels[3]]: detailFour,
      },
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
                <h1 className="mt-2 text-3xl font-bold">{title}</h1>
                <p className="mt-2 text-slate-600">{description}</p>
              </div>
              <div className={invoiceUi.subtleBox}>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Invoice Number
                </p>
                <p className="text-lg font-bold">{invoiceNumber}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={invoiceUi.input} />
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name" className={invoiceUi.input} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={invoiceUi.input} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={invoiceUi.input} />
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Service Address" className={invoiceUi.input} />
              <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Job Title" className={invoiceUi.input} />
              <input value={detailOne} onChange={(e) => setDetailOne(e.target.value)} placeholder={detailLabels[0]} className={invoiceUi.input} />
              <input value={detailTwo} onChange={(e) => setDetailTwo(e.target.value)} placeholder={detailLabels[1]} className={invoiceUi.input} />
              <input value={detailThree} onChange={(e) => setDetailThree(e.target.value)} placeholder={detailLabels[2]} className={invoiceUi.input} />
              <input value={detailFour} onChange={(e) => setDetailFour(e.target.value)} placeholder={detailLabels[3]} className={invoiceUi.input} />
            </div>

            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold">Line Items</h2>
                <button
                  type="button"
                  onClick={() => setItems([...items, { description: "", quantity: 1, price: 0 }])}
                  className="us-btn-primary px-5 py-3 text-sm"
                >
                  Add Item
                </button>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => {
                  const lineTotal = item.quantity * item.price;

                  return (
                    <div key={index} className="rounded-3xl border border-slate-200 p-5">
                      <div className="grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-12">
                          <label className="mb-2 block text-sm font-semibold">
                            Service Description
                          </label>
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-semibold">Quantity</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="mb-2 block text-sm font-semibold">
                            Price Per Unit ($)
                          </label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-semibold">Line Total</label>
                          <div className={invoiceUi.readonlyBox}>${lineTotal.toFixed(2)}</div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold">Remove</label>
                          <button
                            type="button"
                            onClick={() => setItems(items.filter((_, i) => i !== index))}
                            className="us-btn-danger w-full px-3 py-3"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Deposit" className={invoiceUi.input} />
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="Tax Rate" className={invoiceUi.input} />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className={`${invoiceUi.textarea} md:col-span-2`} />
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
                  setMessage(`${serviceType} invoice saved.`);
                  setInvoiceNumber(createInvoiceNumber(prefix));
                }}
                className={invoiceUi.primaryButton}
              />
              <button type="button" onClick={downloadPDF} className={invoiceUi.secondaryButton}>
                Download PDF
              </button>
              <button type="button" onClick={() => window.print()} className={invoiceUi.successButton}>
                Print Invoice
              </button>
              <button type="button" onClick={clearForm} className={invoiceUi.mutedButton}>
                Clear Form
              </button>
            </div>

            <InvoiceStorageNote className="mt-6" />
            {message ? <p className="mt-4 text-sm font-semibold text-[var(--color-success)]">{message}</p> : null}
          </section>

          <aside className={invoiceUi.card}>
            <h2 className="text-2xl font-bold">Invoice Totals</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Deposit</span><span>-${depositAmount.toFixed(2)}</span></div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-bold"><span>Balance Due</span><span>${balanceDue.toFixed(2)}</span></div>
            </div>
          </aside>
        </div>

        <section className="us-preview-frame mt-8">
          <div ref={invoiceRef} className={invoiceUi.previewCard}>
            <div className="flex flex-col gap-4 border-b border-slate-300 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Invoice</p>
                <h2 className="mt-2 text-3xl font-bold">{serviceType}</h2>
                <p className="mt-2 text-sm text-slate-600">{projectTitle}</p>
              </div>
              <div className="text-left text-sm sm:text-right">
                <p className="font-semibold">Invoice #</p>
                <p>{invoiceNumber}</p>
              </div>
            </div>
            <p className="mt-6 font-semibold">{customerName || "Customer name"}</p>
            <p>{phone || "Phone"} · {email || "Email"}</p>
            <p>{address || "Service address"}</p>
            <div className="us-preview-table-wrap mt-8">
              <table className="us-preview-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-slate-200">
                      <td className="px-4 py-3">{item.description || "Service item"}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap us-preview-money">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap us-preview-money">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className="px-4 py-4 text-base" colSpan={3}>Balance Due</td>
                    <td className="px-4 py-4 text-right text-base whitespace-nowrap us-preview-money">${balanceDue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {notes ? <p className="mt-6 text-sm">{notes}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
