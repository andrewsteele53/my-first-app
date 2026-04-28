export const invoiceUi = {
  page:
    "us-page px-6 py-10 text-[var(--color-text)]",
  container: "mx-auto max-w-7xl",
  navLink:
    "us-link text-sm",
  heroCard:
    "rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-9 shadow-[var(--shadow-card)]",
  card:
    "rounded-[1.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)]",
  input:
    "w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-[var(--color-text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(47,93,138,0.12)]",
  textarea:
    "min-h-[120px] w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3.5 text-[var(--color-text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[rgba(47,93,138,0.12)]",
  readonlyBox:
    "rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] p-3.5 text-lg font-bold text-[var(--color-text)]",
  subtleBox:
    "rounded-2xl border border-[var(--color-border-muted)] bg-[var(--color-section)] px-4 py-3.5",
  primaryButton:
    "rounded-2xl bg-[var(--color-primary)] px-5 py-3.5 font-semibold text-white shadow-[var(--shadow-button)] transition hover:scale-[1.01] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
  secondaryButton:
    "rounded-2xl bg-[var(--color-primary)] px-5 py-3.5 font-semibold text-white shadow-[var(--shadow-button)] transition hover:scale-[1.01] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
  successButton:
    "rounded-2xl bg-[var(--color-success)] px-5 py-3.5 font-semibold text-white shadow-[0_10px_22px_rgba(46,125,90,0.22)] transition hover:scale-[1.01] hover:brightness-105 active:brightness-95",
  mutedButton:
    "rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3.5 font-semibold text-[var(--color-text)] shadow-[0_8px_18px_rgba(95,111,127,0.12)] transition hover:scale-[1.01] hover:bg-[#eef3f7] active:bg-[#e3ebf2]",
  dangerButton:
    "rounded-2xl bg-[var(--color-danger)] px-4 py-3.5 font-semibold text-white shadow-[0_10px_22px_rgba(199,80,80,0.22)] transition hover:scale-[1.01] hover:brightness-105 active:brightness-95",
  statusNotice:
    "rounded-2xl border border-[rgba(183,121,31,0.25)] bg-[rgba(183,121,31,0.1)] p-4 text-sm text-[#8b5d15]",
  previewCard:
    "us-preview-document",
};

export function createInvoiceNumber(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}
