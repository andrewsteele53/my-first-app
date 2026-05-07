const pipelineRows = [
  ["Lead", "Follow-up", "Value"],
  ["Greenline Cafe", "Today", "$2,850"],
  ["Northside Fitness", "Tomorrow", "$4,200"],
  ["River Dental", "Friday", "$6,100"],
];

export default function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[rgba(47,93,138,0.18)] via-white to-[rgba(46,125,90,0.14)] blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.6rem] border border-[var(--color-border)] bg-[#0f2233] p-3 shadow-[0_28px_70px_rgba(15,34,51,0.28)]">
        <div className="rounded-[1.25rem] bg-white p-4">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-muted)] pb-4">
            <div>
              <p className="text-xs font-extrabold uppercase text-[var(--color-primary)]">
                Command Center
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-[var(--color-text)]">
                Today&apos;s Business
              </h3>
            </div>
            <span className="rounded-full bg-[rgba(46,125,90,0.1)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">
              Live
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Leads", "24", "+8%"],
              ["Open invoices", "$12.4k", "5 due"],
              ["Follow-ups", "9", "today"],
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
                  {value}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-primary)]">
                  {meta}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div className="overflow-hidden rounded-xl border border-[var(--color-border-muted)]">
              {pipelineRows.map((row, index) => (
                <div
                  key={row.join("-")}
                  className={`grid grid-cols-3 gap-2 px-3 py-3 text-xs ${
                    index === 0
                      ? "bg-[var(--color-surface-secondary)] font-extrabold uppercase text-[var(--color-text-muted)]"
                      : "border-t border-[var(--color-border-muted)] font-semibold text-[var(--color-text)]"
                  }`}
                >
                  {row.map((cell) => (
                    <span key={cell} className="min-w-0 truncate">
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[rgba(47,93,138,0.18)] bg-[rgba(47,93,138,0.07)] p-4">
              <p className="text-xs font-extrabold uppercase text-[var(--color-primary)]">
                AI Next Step
              </p>
              <p className="mt-3 text-sm font-bold leading-6 text-[var(--color-text)]">
                Send follow-up to Greenline Cafe and attach the revised quote.
              </p>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div className="h-2 w-4/5 rounded-full bg-[var(--color-primary)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
