"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvoiceLineItem } from "@/lib/invoices";
import {
  getInvoiceDescriptionTemplates,
  getInvoiceLineItemTemplates,
  saveInvoiceDescriptionTemplate,
  saveInvoiceLineItemTemplate,
} from "@/lib/invoice-templates";

type Props = {
  serviceType: string;
  notes: string;
  items: InvoiceLineItem[];
  onApplyDescription: (text: string) => void;
  onApplyLineItems: (items: InvoiceLineItem[]) => void;
};

export default function InvoiceTemplatePanel({
  serviceType,
  notes,
  items,
  onApplyDescription,
  onApplyLineItems,
}: Props) {
  const [descriptionTemplates, setDescriptionTemplates] = useState(
    getInvoiceDescriptionTemplates(serviceType)
  );
  const [lineItemTemplates, setLineItemTemplates] = useState(
    getInvoiceLineItemTemplates(serviceType)
  );
  const [descriptionName, setDescriptionName] = useState("");
  const [lineItemName, setLineItemName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDescriptionTemplates(getInvoiceDescriptionTemplates(serviceType));
      setLineItemTemplates(getInvoiceLineItemTemplates(serviceType));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [serviceType]);

  const usableLineItems = useMemo(
    () => items.filter((item) => item.description.trim()),
    [items]
  );

  function refreshTemplates() {
    setDescriptionTemplates(getInvoiceDescriptionTemplates(serviceType));
    setLineItemTemplates(getInvoiceLineItemTemplates(serviceType));
  }

  function saveDescriptionTemplate() {
    if (!notes.trim() || !descriptionName.trim()) {
      setMessage("Enter a template name and some notes before saving.");
      return;
    }

    saveInvoiceDescriptionTemplate({
      name: descriptionName.trim(),
      serviceType,
      text: notes.trim(),
    });

    setDescriptionName("");
    setMessage("Description template saved.");
    refreshTemplates();
  }

  function saveLineItemTemplate() {
    if (!lineItemName.trim() || usableLineItems.length === 0) {
      setMessage("Add line items and a template name before saving.");
      return;
    }

    saveInvoiceLineItemTemplate({
      name: lineItemName.trim(),
      serviceType,
      items: usableLineItems,
    });

    setLineItemName("");
    setMessage("Line item template saved.");
    refreshTemplates();
  }

  return (
    <section className="mt-8 rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Templates
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            Reuse common invoice content
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          Save the notes and line items you use repeatedly so future invoices are
          faster to build.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Description Templates
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={descriptionName}
              onChange={(event) => setDescriptionName(event.target.value)}
              placeholder="Template name"
              className="us-input"
            />
            <button
              type="button"
              onClick={saveDescriptionTemplate}
              className="us-btn-primary"
            >
              Save Current Notes
            </button>
          </div>

          {descriptionTemplates.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              No saved note templates yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {descriptionTemplates.slice(0, 4).map((template) => (
                <div
                  key={template.id}
                  className="rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">
                        {template.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                        {template.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyDescription(template.text)}
                      className="us-btn-secondary px-4 py-2 text-sm"
                    >
                      Insert Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
            Line Item Templates
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <input
              value={lineItemName}
              onChange={(event) => setLineItemName(event.target.value)}
              placeholder="Template name"
              className="us-input"
            />
            <button
              type="button"
              onClick={saveLineItemTemplate}
              className="us-btn-primary"
            >
              Save Current Line Items
            </button>
          </div>

          {lineItemTemplates.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
              No saved line item templates yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {lineItemTemplates.slice(0, 4).map((template) => (
                <div
                  key={template.id}
                  className="rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">
                        {template.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {template.items.length} saved line item
                        {template.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onApplyLineItems(template.items)}
                      className="us-btn-secondary px-4 py-2 text-sm"
                    >
                      Insert Items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-semibold text-[var(--color-success)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
