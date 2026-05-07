"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BOOKING_STATUSES,
  getSchedulingServiceSuggestions,
  getStatusClasses,
  getStatusLabel,
  type BookingRow,
  type BookingStatus,
} from "@/lib/scheduling";

type BookingFormState = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  service_type: string;
  job_address: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string;
};

const EMPTY_FORM: BookingFormState = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  service_type: "",
  job_address: "",
  booking_date: "",
  start_time: "",
  end_time: "",
  status: "pending",
  notes: "",
};

type SchedulingPageClientProps = {
  userId: string;
  industryLabel: string;
  initialBookings: BookingRow[];
};

function cleanOptional(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toFormState(booking: BookingRow): BookingFormState {
  return {
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone ?? "",
    customer_email: booking.customer_email ?? "",
    service_type: booking.service_type ?? "",
    job_address: booking.job_address ?? "",
    booking_date: booking.booking_date,
    start_time: booking.start_time?.slice(0, 5) ?? "",
    end_time: booking.end_time?.slice(0, 5) ?? "",
    status: booking.status,
    notes: booking.notes ?? "",
  };
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string | null) {
  if (!value) return "Time TBD";
  const [hour, minute] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function localDateString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getBookingTimingLabel(booking: BookingRow) {
  const today = localDateString();
  const tomorrow = localDateString(addDays(new Date(), 1));
  const weekEnd = localDateString(addDays(new Date(), 7));

  if (booking.status === "pending" && booking.booking_date < today) {
    return { label: "Overdue", classes: "bg-[rgba(199,80,80,0.12)] text-[var(--color-danger)]" };
  }

  if (booking.booking_date === today) {
    return { label: "Today", classes: "bg-[rgba(46,125,90,0.12)] text-[var(--color-success)]" };
  }

  if (booking.booking_date === tomorrow) {
    return { label: "Tomorrow", classes: "bg-[rgba(47,93,138,0.1)] text-[var(--color-primary)]" };
  }

  if (booking.booking_date > today && booking.booking_date <= weekEnd) {
    return { label: "This Week", classes: "bg-[rgba(183,121,31,0.1)] text-[var(--color-warning)]" };
  }

  return null;
}

export default function SchedulingPageClient({
  userId,
  industryLabel,
  initialBookings,
}: SchedulingPageClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [bookings, setBookings] = useState(initialBookings);
  const [form, setForm] = useState<BookingFormState>(EMPTY_FORM);
  const [editingBookingId, setEditingBookingId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(initialBookings.length === 0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const serviceSuggestions = getSchedulingServiceSuggestions(industryLabel);
  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const aKey = `${a.booking_date} ${a.start_time ?? ""}`;
        const bKey = `${b.booking_date} ${b.start_time ?? ""}`;
        return aKey.localeCompare(bKey);
      }),
    [bookings]
  );

  const today = localDateString();
  const weekEnd = localDateString(addDays(new Date(), 7));
  const monthStart = `${today.slice(0, 8)}01`;
  const nextMonth = new Date(`${monthStart}T00:00:00`);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStart = localDateString(nextMonth);

  const upcomingThisWeek = bookings.filter(
    (booking) =>
      booking.booking_date >= today &&
      booking.booking_date <= weekEnd &&
      booking.status !== "cancelled"
  ).length;
  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;
  const completedThisMonth = bookings.filter(
    (booking) =>
      booking.status === "completed" &&
      booking.booking_date >= monthStart &&
      booking.booking_date < nextMonthStart
  ).length;
  const overduePending = bookings.filter(
    (booking) => booking.status === "pending" && booking.booking_date < today
  ).length;

  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingBookingId("");
    setIsFormOpen(false);
  }

  async function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.customer_name.trim() || !form.booking_date) {
      setError("Customer name and booking date are required.");
      return;
    }

    setIsSaving(true);

    const payload = {
      user_id: userId,
      customer_name: form.customer_name.trim(),
      customer_phone: cleanOptional(form.customer_phone),
      customer_email: cleanOptional(form.customer_email),
      service_type: cleanOptional(form.service_type),
      job_address: cleanOptional(form.job_address),
      booking_date: form.booking_date,
      start_time: cleanOptional(form.start_time),
      end_time: cleanOptional(form.end_time),
      status: form.status,
      notes: cleanOptional(form.notes),
    };

    const result = editingBookingId
      ? await supabase
          .from("bookings")
          .update(payload)
          .eq("id", editingBookingId)
          .select("*")
          .single()
      : await supabase.from("bookings").insert(payload).select("*").single();

    setIsSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    const saved = result.data as BookingRow;
    setBookings((current) =>
      editingBookingId
        ? current.map((booking) => (booking.id === saved.id ? saved : booking))
        : [saved, ...current]
    );
    setMessage(editingBookingId ? "Booking updated." : "Booking saved.");
    resetForm();
  }

  function editBooking(booking: BookingRow) {
    setEditingBookingId(booking.id);
    setForm(toFormState(booking));
    setIsFormOpen(true);
    setMessage("");
    setError("");
  }

  async function updateStatus(booking: BookingRow, status: BookingStatus) {
    setError("");
    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", booking.id)
      .select("*")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setBookings((current) =>
      current.map((item) => (item.id === booking.id ? (data as BookingRow) : item))
    );
    setMessage(status === "completed" ? "Booking marked completed." : "Booking updated.");
  }

  async function deleteBooking(booking: BookingRow) {
    setError("");
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setBookings((current) => current.filter((item) => item.id !== booking.id));
    if (editingBookingId === booking.id) resetForm();
    setMessage("Booking deleted.");
  }

  return (
    <main className="us-page">
      <div className="us-shell space-y-8">
        <section className="us-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="us-kicker">Subscriber Scheduling</p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-text)] md:text-5xl">
                Scheduling
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                Manage appointments, booked jobs, estimates, consultations, and
                service calls for your {industryLabel.toLowerCase()} business.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingBookingId("");
                setIsFormOpen(true);
              }}
              className="us-btn-primary min-h-14 px-8"
            >
              New Booking
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Upcoming This Week", upcomingThisWeek],
            ["Pending Bookings", pendingCount],
            ["Completed This Month", completedThisMonth],
            ["Overdue Pending", overduePending],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[1.2rem] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card-soft)]"
            >
              <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                {label}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[var(--color-primary)]">
                {value}
              </p>
            </div>
          ))}
        </section>

        {message ? <div className="us-notice-success text-sm">{message}</div> : null}
        {error ? <div className="us-notice-danger text-sm">{error}</div> : null}

        {isFormOpen ? (
          <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="us-kicker">{editingBookingId ? "Edit Booking" : "New Booking"}</p>
                <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
                  {editingBookingId ? "Update booking details" : "Schedule a job, estimate, or service call"}
                </h2>
              </div>
              <button type="button" onClick={resetForm} className="us-btn-secondary text-sm">
                Close
              </button>
            </div>

            <form onSubmit={saveBooking} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Customer name
                <input
                  className="us-input"
                  value={form.customer_name}
                  onChange={(event) => updateField("customer_name", event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Customer phone
                <input
                  className="us-input"
                  type="tel"
                  value={form.customer_phone}
                  onChange={(event) => updateField("customer_phone", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Customer email
                <input
                  className="us-input"
                  type="email"
                  value={form.customer_email}
                  onChange={(event) => updateField("customer_email", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Service type
                <input
                  className="us-input"
                  list="scheduling-service-suggestions"
                  value={form.service_type}
                  onChange={(event) => updateField("service_type", event.target.value)}
                />
                <datalist id="scheduling-service-suggestions">
                  {serviceSuggestions.map((service) => (
                    <option key={service} value={service} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
                Job address
                <input
                  className="us-input"
                  value={form.job_address}
                  onChange={(event) => updateField("job_address", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Date
                <input
                  className="us-input"
                  type="date"
                  value={form.booking_date}
                  onChange={(event) => updateField("booking_date", event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Start time
                <input
                  className="us-input"
                  type="time"
                  value={form.start_time}
                  onChange={(event) => updateField("start_time", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                End time
                <input
                  className="us-input"
                  type="time"
                  value={form.end_time}
                  onChange={(event) => updateField("end_time", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)]">
                Booking status
                <select
                  className="us-input"
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value as BookingStatus)}
                >
                  {BOOKING_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-[var(--color-text)] md:col-span-2">
                Notes
                <textarea
                  className="us-textarea"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="us-btn-primary md:col-span-2"
              >
                {isSaving ? "Saving..." : "Save Booking"}
              </button>
            </form>
          </section>
        ) : null}

        <section className="rounded-[1.6rem] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card-soft)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="us-kicker">Bookings</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--color-text)]">
                Calendar-style appointment list
              </h2>
            </div>
            <Link href="/" className="us-btn-secondary text-sm">
              Back to Dashboard
            </Link>
          </div>

          {sortedBookings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-8 text-center">
              <p className="text-lg font-extrabold text-[var(--color-text)]">
                No bookings yet. Schedule your first job, estimate, or service call.
              </p>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="us-btn-primary mt-5"
              >
                New Booking
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {sortedBookings.map((booking) => {
                const timing = getBookingTimingLabel(booking);
                const isOverdue =
                  booking.status === "pending" && booking.booking_date < today;

                return (
                  <article
                    key={booking.id}
                    className={`rounded-2xl border bg-white p-5 shadow-[var(--shadow-card-soft)] ${
                      isOverdue
                        ? "border-[rgba(199,80,80,0.35)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClasses(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                          {timing ? (
                            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${timing.classes}`}>
                              {timing.label}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-4 text-xl font-extrabold text-[var(--color-text)]">
                          {booking.customer_name}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-[var(--color-primary)]">
                          {booking.service_type || "Service call"}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {booking.job_address || "Address not added"}
                        </p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                          <p className="text-xs font-extrabold uppercase text-[var(--color-text-muted)]">
                            Date and time
                          </p>
                          <p className="mt-2 text-sm font-bold text-[var(--color-text)]">
                            {formatDate(booking.booking_date)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">
                            {formatTime(booking.start_time)}
                            {booking.end_time ? ` - ${formatTime(booking.end_time)}` : ""}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border-muted)] bg-[var(--color-surface-secondary)] p-4">
                          <p className="text-xs font-extrabold uppercase text-[var(--color-text-muted)]">
                            Contact
                          </p>
                          <p className="mt-2 text-sm font-bold text-[var(--color-text)]">
                            {booking.customer_phone || "No phone"}
                          </p>
                          <p className="mt-1 break-all text-sm font-semibold text-[var(--color-text-secondary)]">
                            {booking.customer_email || "No email"}
                          </p>
                        </div>
                        {booking.notes ? (
                          <p className="rounded-xl border border-[var(--color-border-muted)] bg-white p-4 text-sm leading-6 text-[var(--color-text-secondary)] md:col-span-2">
                            {booking.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        onClick={() => editBooking(booking)}
                        className="us-btn-secondary text-sm"
                      >
                        Edit Booking
                      </button>
                      {booking.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking, "completed")}
                          className="us-btn-success text-sm"
                        >
                          Mark Completed
                        </button>
                      ) : null}
                      {booking.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => updateStatus(booking, "cancelled")}
                          className="us-btn-secondary text-sm"
                        >
                          Cancel Booking
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteBooking(booking)}
                        className="us-btn-danger text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
