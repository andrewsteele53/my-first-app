"use client";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function DeleteConfirmationModal({
  open,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-md rounded-[1.5rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-extrabold text-[var(--color-text)]">
          Confirm Delete
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Are you sure you want to delete? After 30 days items in trash are
          automatically deleted and can not be restored.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="us-btn-secondary w-full px-4 py-2 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="us-btn-danger w-full px-4 py-2 sm:w-auto"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
