"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type InvoiceLineItem } from "@/lib/invoices";
import { createInvoiceNumber, invoiceUi } from "@/lib/invoice-ui";
import { type QuoteRecord, type QuoteStatus, saveQuoteRecord } from "@/lib/quotes";

type Props = {
  quoteType: string;
  title: string;
  description: string;
  prefix: string;
  defaultItem: InvoiceLineItem;
  defaultItems?: InvoiceLineItem[];
  tips: string[];
};

export default function QuoteFormPage({
  quoteType,
  title,
  description,
  prefix,
  defaultItem,
  defaultItems,
  tips,
}: Props) {
  const initialItems = useMemo(
    () => (defaultItems?.length ? defaultItems : [defaultItem]).map((item) => ({ ...item })),
    [defaultItem, defaultItems]
  );
  const [quoteNumber, setQuoteNumber] = useState(() => createInvoiceNumber(prefix));
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState(quoteType);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("Draft");
  const [taxRate, setTaxRate] = useState("0");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>(initialItems);

  const taxPercent = Number(taxRate) || 0;
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items]
  );
  const taxAmount = useMemo(
    () => subtotal * (taxPercent / 100),
    [subtotal, taxPercent]
  );
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, price: 0 }]);
  }

  function updateItem(index: number, field: keyof InvoiceLineItem, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function removeItem(index: number) {
    const next = items.filter((_, itemIndex) => itemIndex !== index);
    setItems(next.length ? next : initialItems);
  }

  function clearForm() {
    setQuoteNumber(createInvoiceNumber(prefix));
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setServiceAddress("");
    setProjectTitle(quoteType);
    setNotes("");
    setStatus("Draft");
    setTaxRate("0");
    setItems(initialItems);
    setMessage("");
  }

  function saveQuote() {
    if (!customerName.trim() || !quoteNumber.trim()) {
      setMessage("Please add a customer name and quote number before saving.");
      return;
    }

    const now = new Date().toISOString();
    const quote: QuoteRecord = {
      id: crypto.randomUUID(),
      quoteNumber,
      quoteType,
      customerName,
      customerEmail,
      customerPhone,
      serviceAddress,
      projectTitle,
      notes,
      items,
      subtotal,
      taxRate: taxPercent,
      taxAmount,
      total,
      status,
      createdAt: now,
      updatedAt: now,
    };

    saveQuoteRecord(quote);
    setMessage(`${quoteType} saved.`);
    setQuoteNumber(createInvoiceNumber(prefix));
  }

  return (
    <main className={invoiceUi.page}>
      <div className={invoiceUi.container}>
        <div className="mb-4 flex flex-wrap gap-4">
          <Link href="/quotes" className={invoiceUi.navLink}>
            Back to Quotes
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
                  Quote System
                </p>
                <h1 className="mt-2 text-3xl font-bold">{title}</h1>
                <p className="mt-2 text-slate-600">{description}</p>
              </div>
              <div className={invoiceUi.subtleBox}>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Quote Number
                </p>
                <p className="text-lg font-bold">{quoteNumber}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Quote Number</label>
                <input
                  value={quoteNumber}
                  onChange={(event) => setQuoteNumber(event.target.value)}
                  className={invoiceUi.input}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Status</label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as QuoteStatus)}
                  className={invoiceUi.input}
                >
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Approved</option>
                  <option>Rejected</option>
                  <option>Converted</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Customer Name</label>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="John Smith"
                  className={invoiceUi.input}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Customer Email</label>
                <input
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="customer@email.com"
                  className={invoiceUi.input}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Customer Phone</label>
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="(555) 555-5555"
                  className={invoiceUi.input}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Service Address</label>
                <input
                  value={serviceAddress}
                  onChange={(event) => setServiceAddress(event.target.value)}
                  placeholder="123 Main St"
                  className={invoiceUi.input}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Project Title</label>
                <input
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  className={invoiceUi.input}
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Quote Line Items</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Add labor, materials, parts, packages, and project add-ons.
                  </p>
                </div>
                <button type="button" onClick={addItem} className="us-btn-primary px-5 py-3 text-sm">
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 p-5">
                    <div className="grid gap-4 md:grid-cols-12">
                      <div className="md:col-span-12">
                        <label className="mb-2 block text-sm font-semibold">
                          Service Description
                        </label>
                        <input
                          value={item.description}
                          onChange={(event) =>
                            updateItem(index, "description", event.target.value)
                          }
                          className={invoiceUi.input}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-semibold">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", Number(event.target.value))
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
                          value={item.price}
                          onChange={(event) =>
                            updateItem(index, "price", Number(event.target.value))
                          }
                          className={invoiceUi.input}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-semibold">Line Total</label>
                        <div className={invoiceUi.readonlyBox}>
                          ${(item.quantity * item.price).toFixed(2)}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold">Remove</label>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="us-btn-danger w-full px-3 py-3"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  className={invoiceUi.input}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Scope details, exclusions, timeline, approval notes..."
                  className={invoiceUi.textarea}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={saveQuote} className={invoiceUi.primaryButton}>
                Save Quote
              </button>
              <button type="button" onClick={clearForm} className={invoiceUi.mutedButton}>
                Clear Form
              </button>
            </div>

            {message ? (
              <p className="mt-4 text-sm font-semibold text-[var(--color-success)]">
                {message}
              </p>
            ) : null}
          </section>

          <aside className="space-y-6">
            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Quote Totals</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax</span>
                  <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold">Estimated Total</span>
                    <span className="text-base font-bold">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={invoiceUi.card}>
              <h2 className="text-2xl font-bold">Quote Notes</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {tips.map((tip) => (
                  <p key={tip}>{tip}</p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
