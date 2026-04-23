"use client";

type Props = {
  label: string;
  onClick: () => void;
};

export default function AISuggestionChip({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] shadow-[0_6px_16px_rgba(95,111,127,0.1)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[#edf3f8] hover:text-[var(--color-primary)]"
    >
      {label}
    </button>
  );
}
