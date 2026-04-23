"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatInvoiceCurrency,
  getSavedInvoices,
  type InvoiceRecord,
} from "@/lib/invoices";
import {
  getFollowUpsDueToday,
  getSavedLeads,
  getUpcomingFollowUps,
  type LeadRecord,
} from "@/lib/leads";

const ONBOARDING_KEY = "dashboard_onboarding_dismissed_v1";
const MAPPING_STORAGE_KEY = "sales_mapping_areas_v3";

type Props = {
  isSubscribed: boolean;
};

export default function DashboardInsights({ isSubscribed }: Props) {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [mappingCount, setMappingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setInvoices(getSavedInvoices());
      setLeads(getSavedLeads());
      try {
        const rawAreas = localStorage.getItem(MAPPING_STORAGE_KEY);
        const parsedAreas = rawAreas ? JSON.parse(rawAreas) : [];
        setMappingCount(Array.isArray(parsedAreas) ? parsedAreas.length : 0);
      } catch {
        setMappingCount(0);
      }
      setDismissed(localStorage.getItem(ONBOARDING_KEY) === "true");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const paidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.paymentStatus === "Paid"),
    [invoices]
  );
  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.paymentStatus !== "Paid"),
    [invoices]
  );
  const totalRevenue = useMemo(
    () => paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    [paidInvoices]
  );
  const wonLeads = useMemo(
    () => leads.filter((lead) => lead.status === "Won").length,
    [leads]
  );
  const lostLeads = useMemo(
    () => leads.filter((lead) => lead.status === "Lost").length,
    [leads]
  );
  const dueToday = useMemo(() => getFollowUpsDueToday(leads), [leads]);
  const upcomingFollowUps = useMemo(
    () => getUpcomingFollowUps(leads),
    [leads]
  );

  const checklist = [
    {
      label: "Create your first invoice",
      complete: invoices.length > 0,
      href: "/invoices",
    },
    {
      label: "Add your first lead",
      complete: leads.length > 0,
      href: "/leads",
    },
    {
      label: "Explore mapping",
      complete: mappingCount > 0,
      href: "/mapping",
    },
    {
      label: "Upgrade for AI",
      complete: isSubscribed,
      href: "/subscribe",
    },
  ];

  function dismissOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="space-y-8">
      {!dismissed ? (
        <section className="us-card p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-panel-title">Onboarding</p>
              <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
                Set up your workspace fast
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
                Use this short checklist to get value from the app quickly and
                make the dashboard feel useful on day one.
              </p>
            </div>

            <button
              type="button"
              onClick={dismissOnboarding}
              className="us-btn-secondary px-4 py-2 text-sm"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {checklist.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)] transition hover:-translate-y-[1px]"
              >
                <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  {item.complete ? "Complete" : "Next Step"}
                </p>
                <p className="mt-2 text-lg font-bold text-[var(--color-text)]">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.95fr]">
        <div className="us-card p-8">
          <p className="us-panel-title">Business Snapshot</p>
          <h2 className="mt-3 text-3xl font-extrabold text-[var(--color-text)]">
            Daily numbers at a glance
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Total Invoices
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {invoices.length}
              </p>
            </div>

            <div className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Paid Invoices
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {paidInvoices.length}
              </p>
            </div>

            <div className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Unpaid Invoices
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {unpaidInvoices.length}
              </p>
            </div>

            <div className="us-stat-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Total Revenue
              </p>
              <p className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                {formatInvoiceCurrency(totalRevenue)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="us-subtle-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Leads Created
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                {leads.length}
              </p>
            </div>

            <div className="us-subtle-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Won Leads
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                {wonLeads}
              </p>
            </div>

            <div className="us-subtle-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Lost Leads
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                {lostLeads}
              </p>
            </div>

            <div className="us-subtle-card">
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                Follow-Ups Due Today
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                {dueToday.length}
              </p>
            </div>
          </div>
        </div>

        <div className="us-card p-8">
          <p className="us-panel-title">Reminders</p>
          <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
            Upcoming follow-ups
          </h2>

          {upcomingFollowUps.length === 0 ? (
            <div className="mt-5 rounded-[1.2rem] border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-5 text-sm text-[var(--color-text-secondary)]">
              No follow-ups scheduled yet. Add a lead follow-up date to keep the
              dashboard working like a lightweight CRM.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {upcomingFollowUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-text)]">
                        {followUp.fullName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {followUp.serviceType}
                        {followUp.area ? ` | ${followUp.area}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-primary)]">
                      {new Date(followUp.followUpDate).toLocaleDateString()}
                    </span>
                  </div>

                  {followUp.reminderNote ? (
                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {followUp.reminderNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
