"use client";

type Props = {
  label: string;
  onClick: () => void;
};

export default function AIInsertButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="us-btn-primary px-3 py-2 text-sm"
    >
      {label}
    </button>
  );
}
