import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";
import { createServerClient } from "@/lib/supabase/server";
import { requireAccountRole } from "@/lib/roles";
import { formatMoney } from "@/lib/sales-commission";

export const dynamic = "force-dynamic";

const demoCustomers = [
  {
    name: "Brightline Auto Detail",
    contact: "Maya Collins",
    email: "maya@example-demo.com",
    phone: "(555) 014-2210",
    status: "active",
    value: 1280,
  },
  {
    name: "North Ridge Lawn Care",
    contact: "Evan Brooks",
    email: "evan@example-demo.com",
    phone: "(555) 014-7712",
    status: "follow_up",
    value: 840,
  },
  {
    name: "Cedar Creek Handyman",
    contact: "Jordan Lee",
    email: "jordan@example-demo.com",
    phone: "(555) 014-9088",
    status: "quoted",
    value: 2150,
  },
];

const demoLeads = [
  {
    business: "Atlas Powerwashing",
    contact: "Nina Patel",
    status: "follow_up",
    due: "Tomorrow",
    notes: "Asked for a quote template and QuickBooks sync walkthrough.",
  },
  {
    business: "Summit Roofing Repair",
    contact: "Carlos Vega",
    status: "interested",
    due: "Friday",
    notes: "Wants a mobile-friendly way to track roof inspections.",
  },
  {
    business: "Metro Junk Removal",
    contact: "Tara Mills",
    status: "contacted",
    due: "Next week",
    notes: "Good fit for lead tracking and saved invoice templates.",
  },
];

const demoQuotes = [
  { number: "Q-1042", customer: "Cedar Creek Handyman", service: "Kitchen repair package", total: 2150, status: "sent" },
  { number: "Q-1043", customer: "Atlas Powerwashing", service: "Driveway and siding wash", total: 675, status: "draft" },
];

const demoInvoices = [
  { number: "INV-2038", customer: "Brightline Auto Detail", total: 480, status: "paid", due: "Paid today" },
  { number: "INV-2039", customer: "North Ridge Lawn Care", total: 360, status: "open", due: "Due in 5 days" },
  { number: "INV-2040", customer: "Cedar Creek Handyman", total: 910, status: "overdue", due: "2 days overdue" },
];

function statusBadge(status: string) {
  const normalized = status.replace(/_/g, " ");
  const className =
    status === "active" || status === "paid" || status === "interested"
      ? "border-[rgba(46,125,90,0.2)] bg-[rgba(46,125,90,0.1)] text-[var(--color-success)]"
      : status === "overdue"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${className}`}>
      {normalized}
    </span>
  );
}

export default async function DemoPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const role = await requireAccountRole(supabase, user, ["admin", "sales"]);

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="us-kicker">Unified Steele Demo</p>
              <h1 className="mt-3 text-4xl font-extrabold text-[var(--color-text)]">
                Demo Preview
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Walk prospects through a realistic service business dashboard without touching real customer records.
              </p>
              <div className="us-notice-info mt-5 text-sm">
                Demo Preview - sample data only. No real customer data is shown.
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {role === "admin" ? <Link href="/admin" className="us-btn-primary">Back to Admin</Link> : null}
              {role === "sales" ? <Link href="/sales" className="us-btn-primary">Back to Sales Portal</Link> : null}
              {role === "admin" ? <Link href="/sales" className="us-btn-secondary">Back to Sales Portal</Link> : null}
              <Link href="/" className="us-btn-secondary">Back to Dashboard</Link>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Open Revenue" value={formatMoney(1270)} />
          <MetricCard label="Quotes Pending" value="2" />
          <MetricCard label="Follow-ups Due" value="3" />
          <MetricCard label="QuickBooks Status" value="Ready" />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel title="Dashboard Overview" kicker="Today">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniStat label="New Leads" value="5" />
              <MiniStat label="Jobs Scheduled" value="7" />
              <MiniStat label="Invoices Open" value="2" />
            </div>
            <div className="mt-4 rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4">
              <p className="text-sm font-bold">Priority follow-up</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Atlas Powerwashing viewed quote Q-1043 twice. Call before 3 PM and offer to schedule next week.
              </p>
            </div>
          </Panel>

          <Panel title="AI Assistant Preview" kicker="Demo">
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              Demo insight: two open invoices are likely collectible this week. The strongest sales opportunity is
              Summit Roofing Repair because they asked about inspection tracking and quote speed.
            </p>
            <div className="mt-4 rounded-[1rem] border border-[rgba(183,121,31,0.24)] bg-[rgba(183,121,31,0.08)] p-4 text-sm font-bold text-[var(--color-warning)]">
              Demo AI only - no live account data is analyzed.
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <TablePanel title="Customers" kicker="Sample accounts">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Value</th>
              </tr>
            </thead>
            <tbody>
              {demoCustomers.map((customer) => (
                <tr key={customer.name} className="border-b border-[var(--color-border-muted)] align-top">
                  <td className="py-4 pr-4 font-bold">{customer.name}</td>
                  <td className="py-4 pr-4">
                    <p>{customer.contact}</p>
                    <p className="mt-1 break-all text-xs text-[var(--color-text-secondary)]">{customer.email}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{customer.phone}</p>
                  </td>
                  <td className="py-4 pr-4">{statusBadge(customer.status)}</td>
                  <td className="py-4 pr-4">{formatMoney(customer.value)}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>

          <TablePanel title="Leads" kicker="Sales follow-up">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Lead</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Follow-up</th>
                <th className="py-3 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {demoLeads.map((lead) => (
                <tr key={lead.business} className="border-b border-[var(--color-border-muted)] align-top">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{lead.business}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{lead.contact}</p>
                  </td>
                  <td className="py-4 pr-4">{statusBadge(lead.status)}</td>
                  <td className="py-4 pr-4">{lead.due}</td>
                  <td className="py-4 pr-4 text-[var(--color-text-secondary)]">{lead.notes}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <TablePanel title="Quotes" kicker="Preview">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Quote</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Service</th>
                <th className="py-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {demoQuotes.map((quote) => (
                <tr key={quote.number} className="border-b border-[var(--color-border-muted)]">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{quote.number}</p>
                    {statusBadge(quote.status)}
                  </td>
                  <td className="py-4 pr-4">{quote.customer}</td>
                  <td className="py-4 pr-4">{quote.service}</td>
                  <td className="py-4 pr-4">{formatMoney(quote.total)}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>

          <TablePanel title="Invoices" kicker="Preview">
            <thead className="border-b border-[var(--color-border-muted)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-3 pr-4">Invoice</th>
                <th className="py-3 pr-4">Customer</th>
                <th className="py-3 pr-4">Due</th>
                <th className="py-3 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {demoInvoices.map((invoice) => (
                <tr key={invoice.number} className="border-b border-[var(--color-border-muted)]">
                  <td className="py-4 pr-4">
                    <p className="font-bold">{invoice.number}</p>
                    {statusBadge(invoice.status)}
                  </td>
                  <td className="py-4 pr-4">{invoice.customer}</td>
                  <td className="py-4 pr-4">{invoice.due}</td>
                  <td className="py-4 pr-4">{formatMoney(invoice.total)}</td>
                </tr>
              ))}
            </tbody>
          </TablePanel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="Sales Mapping" kicker="Territory preview">
            <div className="rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4">
              <div className="grid grid-cols-3 gap-2">
                {["Hot", "Warm", "New", "Route", "Lead", "Won", "Quote", "Due", "Call"].map((item) => (
                  <div key={item} className="rounded-[0.8rem] border border-[var(--color-border)] bg-white p-3 text-center text-xs font-bold">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
              Sample map clusters show nearby leads, follow-ups, and quoted jobs for a cleaner sales route.
            </p>
          </Panel>

          <Panel title="Business Profile" kicker="Settings preview">
            <div className="space-y-3 text-sm">
              <PreviewRow label="Business" value="Demo Service Co." />
              <PreviewRow label="Industry" value="Home Services" />
              <PreviewRow label="Default Quote" value="General Service Quote" />
              <PreviewRow label="Default Invoice" value="General Service Invoice" />
            </div>
          </Panel>

          <Panel title="QuickBooks" kicker="Connection preview">
            <div className="space-y-3 text-sm">
              <PreviewRow label="Status" value="Connected in demo" />
              <PreviewRow label="Last sync" value="8 minutes ago" />
              <PreviewRow label="Customers synced" value="18 sample records" />
              <PreviewRow label="Invoices queued" value="2 sample invoices" />
            </div>
          </Panel>
        </section>

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <p className="us-kicker">Demo Safety</p>
          <h2 className="mt-2 text-2xl font-extrabold">Read-only sales walkthrough</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-[var(--color-text-secondary)] sm:grid-cols-2 lg:grid-cols-4">
            <p>No database writes</p>
            <p>No real customer data</p>
            <p>No subscription check</p>
            <p>No live quote or invoice creation</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]">
      <p className="text-sm font-bold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
      <p className="us-kicker">{kicker}</p>
      <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TablePanel({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
      <p className="us-kicker">{kicker}</p>
      <h2 className="mt-2 text-2xl font-extrabold">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">{children}</table>
      </div>
    </section>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[0.9rem] border border-[var(--color-border-muted)] bg-[var(--color-section)] px-4 py-3">
      <span className="font-bold text-[var(--color-text)]">{label}</span>
      <span className="text-right text-[var(--color-text-secondary)]">{value}</span>
    </div>
  );
}
