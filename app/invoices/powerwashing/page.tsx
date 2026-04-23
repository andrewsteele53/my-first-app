"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceSaveButton from "@/components/invoice-save-button";
import InvoiceStorageNote from "@/components/invoice-storage-note";
import InvoiceAIAssistant from "@/components/invoice-ai-assistant";
import InvoicePaymentFields from "@/components/invoice-payment-fields";
import InvoiceTemplatePanel from "@/components/invoice-template-panel";
import {
  InvoiceLineItem,
  InvoiceRecord,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/invoices";
import { createInvoiceNumber, invoiceUi } from "@/lib/invoice-ui";
export default function PowerWashingInvoicePage() {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [invoiceNumber, setInvoiceNumber] = useState(() => createInvoiceNumber("PWASH"));
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("Power Washing Service");
  const [notes, setNotes] = useState("");

  const [surfaceType, setSurfaceType] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [waterSourceAvailable, setWaterSourceAvailable] = useState("");
  const [chemicalTreatment, setChemicalTreatment] = useState("");
  const [stainLevel, setStainLevel] = useState("");

  const [taxRate, setTaxRate] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("Unpaid");
  const [paidDate, setPaidDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { description: "Power Washing Service", quantity: 1, price: 150 },
  ]);

  const taxPercent = Number(taxRate) || 0;
  const depositAmount = Number(deposit) || 0;

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity * item.price, 0),
    [items]
  );

  const taxAmount = useMemo(
    () => subtotal * (taxPercent / 100),
    [subtotal, taxPercent]
  );

  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const balanceDue = useMemo(
    () => Math.max(total - depositAmount, 0),
    [total, depositAmount]
  );

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  }

  function updateItem(
    index: number,
    field: keyof InvoiceLineItem,
    value: string | number
  ) {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  }

  function removeItem(index: number) {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ description: "", quantity: 1, price: 0 }]);
  }

  function clearForm() {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setProjectTitle("Power Washing Service");
    setNotes("");
    setSurfaceType("");
    setServiceDate("");
    setSquareFootage("");
    setWaterSourceAvailable("");
    setChemicalTreatment("");
    setStainLevel("");
    setTaxRate("0");
    setDeposit("0");
    setPaymentStatus("Unpaid");
    setPaidDate("");
    setPaymentMethod("");
    setPaymentNotes("");
    setItems([{ description: "Power Washing Service", quantity: 1, price: 150 }]);
    setMessage("");
    setInvoiceNumber(createInvoiceNumber("PWASH"));
  }

  function buildInvoice(): InvoiceRecord | null {
    if (!customerName.trim() || !invoiceNumber.trim()) {
      alert("Please fill out the required fields.");
      return null;
    }

    const invoice: InvoiceRecord = {
      id: crypto.randomUUID(),
      serviceType: "Power Washing",
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
        surfaceType,
        serviceDate,
        squareFootage,
        waterSourceAvailable,
        chemicalTreatment,
        stainLevel,
      },
    };

    return invoice;
  }

  function handleInsertAiText(text: string) {
    setNotes((current) => (current ? `${current}\n\n${text}` : text));
  }

  function handleInsertAiLineItems(lineItems: InvoiceLineItem[]) {
    setItems((current) => [...current, ...lineItems]);
  }

  function handleInsertTemplateText(text: string) {
    setNotes(text);
  }

  function handleInsertTemplateLineItems(lineItems: InvoiceLineItem[]) {
    setItems((current) => [...current, ...lineItems]);
  }

  async function downloadPDF() {
    if (!invoiceRef.current) return;

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`${invoiceNumber}.pdf`);
  }

  function printInvoice() {
    window.print();
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <div className="mb-4 flex flex-wrap gap-4">
          <Link href="/invoices" className={invoiceUi.navLink}>
            ← Back to Invoices
          </Link>
          <Link href="/" className={invoiceUi.navLink}>
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className={invoiceUi.heroCard}>
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Service Invoice System
                </p>
                <h1 className="mt-2 text-3xl font-bold">Power Washing Invoice</h1>
                <p className="mt-2 text-slate-600">
                  Create clean, professional invoices for driveways, siding,
                  patios, decks, fences, and exterior cleaning services.
                </p>
              </div>

              <div className={invoiceUi.subtleBox}>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Invoice Number
                </p>
                <p className="text-lg font-bold">{invoiceNumber}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Invoice Number
                </label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Customer Name
                </label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Smith"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className={invoiceUi.input}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">
                  Service Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className={invoiceUi.input}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Job Title</label>
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Driveway Wash, House Wash, Patio Cleaning..."
                  className={invoiceUi.input}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Surface Type
                </label>
                <input
                  value={surfaceType}
                  onChange={(e) => setSurfaceType(e.target.value)}
                  placeholder="Driveway, siding, deck, patio..."
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Service Date
                </label>
                <input
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Approx. Square Footage
                </label>
                <input
                  value={squareFootage}
                  onChange={(e) => setSquareFootage(e.target.value)}
                  placeholder="500 sq ft"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Water Source Available
                </label>
                <input
                  value={waterSourceAvailable}
                  onChange={(e) => setWaterSourceAvailable(e.target.value)}
                  placeholder="Yes / No"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Chemical Treatment
                </label>
                <input
                  value={chemicalTreatment}
                  onChange={(e) => setChemicalTreatment(e.target.value)}
                  placeholder="Yes / No / Soft wash mix"
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Stain Level
                </label>
                <input
                  value={stainLevel}
                  onChange={(e) => setStainLevel(e.target.value)}
                  placeholder="Light, moderate, heavy..."
                  className={invoiceUi.input}
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Power Washing Line Items</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add washing, soft washing, chemical treatment, or add-ons below.
                  </p>
                </div>

                <button
                  onClick={addItem}
                  className="us-btn-primary px-6 py-4"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const lineTotal = item.quantity * item.price;

                  return (
                    <div
                      key={index}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-12">
                          <label className="mb-2 block text-sm font-semibold">
                            Service Description
                          </label>
                          <input
                            placeholder="Driveway wash, siding wash, patio clean, chemical treatment..."
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-semibold">
                            Quantity
                          </label>
                          <input
                            type="number"
                            placeholder="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", Number(e.target.value))
                            }
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-4">
                          <label className="mb-2 block text-sm font-semibold">
                            Price Per Unit ($)
                          </label>
                          <input
                            type="number"
                            placeholder="150"
                            value={item.price}
                            onChange={(e) =>
                              updateItem(index, "price", Number(e.target.value))
                            }
                            className={invoiceUi.input}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="mb-2 block text-sm font-semibold">
                            Line Total
                          </label>
                          <div className={invoiceUi.readonlyBox}>
                            ${lineTotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-semibold">
                            Remove
                          </label>
                          <button
                            onClick={() => removeItem(index)}
                            className="w-full rounded-2xl bg-red-600 px-3 py-3 font-semibold text-white hover:bg-red-700"
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
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Deposit Paid ($)
                </label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className={invoiceUi.input}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className={invoiceUi.input}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any cleaning notes, stain notes, access notes, or customer requests..."
                  className={invoiceUi.textarea}
                />
              </div>
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

            <InvoiceTemplatePanel
              serviceType="Power Washing"
              notes={notes}
              items={items}
              onApplyDescription={handleInsertTemplateText}
              onApplyLineItems={handleInsertTemplateLineItems}
            />

            <div className="mt-8">
              <InvoiceAIAssistant
                serviceType="Power Washing"
                notes={notes}
                items={items}
                onInsertText={handleInsertAiText}
                onInsertLineItems={handleInsertAiLineItems}
              />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <InvoiceSaveButton
                buildInvoice={buildInvoice}
                onSaved={() => {
                  setMessage("Power washing invoice saved.");
                  setInvoiceNumber(createInvoiceNumber("PWASH"));
                }}
                className={invoiceUi.primaryButton}
              />

              <button
                onClick={downloadPDF}
                className={invoiceUi.secondaryButton}
              >
                Download PDF
              </button>

              <button
                onClick={printInvoice}
                className={invoiceUi.successButton}
              >
                Print Invoice
              </button>

              <button
                onClick={clearForm}
                className={invoiceUi.mutedButton}
              >
                Clear Form
              </button>
            </div>

            <InvoiceStorageNote className="mt-6" />

            {message ? (
              <p className="mt-4 text-sm font-semibold text-[var(--color-success)]">{message}</p>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Invoice Totals</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Deposit</span>
                  <span className="font-semibold">-${depositAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Total</span>
                    <span className="text-base font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="font-semibold">Balance Due</span>
                  <span className="text-lg font-bold">${balanceDue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Pricing Tips</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Charge separately for chemical treatment or soft washing.</p>
                <p>Add oil, rust, or algae treatment as separate billable items.</p>
                <p>Use quantity for multiple areas or repeat services.</p>
                <p>Keep driveway, siding, patio, and fence work itemized for clarity.</p>
              </div>
            </div>

            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Popular Power Washing Services</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Driveway washing</p>
                <p>House siding wash</p>
                <p>Patio cleaning</p>
                <p>Deck washing</p>
                <p>Fence cleaning</p>
                <p>Soft washing treatment</p>
                <p>Rust or stain removal</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[1.9rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
          <div
            ref={invoiceRef}
            className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 text-black"
          >
            <div className="flex items-start justify-between border-b border-slate-300 pb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  Invoice
                </p>
                <h2 className="mt-2 text-3xl font-bold">Power Washing Services</h2>
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
                <p className="mt-2 text-lg font-semibold">
                  {customerName || "Customer name"}
                </p>
                <p className="mt-1">{phone || "Phone"}</p>
                <p className="mt-1">{email || "Email"}</p>
                <p className="mt-1">{address || "Address"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Job Details
                </p>
                <p className="mt-2">{surfaceType || "Surface type"}</p>
                <p className="mt-1">Service Date: {serviceDate || "-"}</p>
                <p className="mt-1">Square Footage: {squareFootage || "-"}</p>
                <p className="mt-1">Water Source: {waterSourceAvailable || "-"}</p>
                <p className="mt-1">Chemical Treatment: {chemicalTreatment || "-"}</p>
                <p className="mt-1">Stain Level: {stainLevel || "-"}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Payment Status
                </p>
                <p className="mt-2">{paymentStatus}</p>
                <p className="mt-1">Paid Date: {paidDate || "-"}</p>
                <p className="mt-1">Method: {paymentMethod || "-"}</p>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-300">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
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

                  <tr className="border-t border-slate-200">
                    <td className="px-4 py-3" colSpan={3}>
                      Tax
                    </td>
                    <td className="px-4 py-3 text-right">${taxAmount.toFixed(2)}</td>
                  </tr>

                  <tr className="border-t border-slate-200">
                    <td className="px-4 py-3" colSpan={3}>
                      Deposit Paid
                    </td>
                    <td className="px-4 py-3 text-right">
                      -${depositAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="border-t-2 border-slate-400">
                  <tr>
                    <td className="px-4 py-4 text-base font-bold" colSpan={3}>
                      Balance Due
                    </td>
                    <td className="px-4 py-4 text-right text-base font-bold">
                      ${balanceDue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {notes ? (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-500">Notes</p>
                <p className="mt-2 text-sm">{notes}</p>
              </div>
            ) : null}

            {paymentNotes ? (
              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-500">
                  Payment Notes
                </p>
                <p className="mt-2 text-sm">{paymentNotes}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

