// frontend/src/pages/ApplicationsPage.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../api/applications";

const STATUS_OPTIONS = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Banner({ type = "info", title, message, onClose }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex items-start gap-3",
        styles
      )}
    >
      <div className="flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className="text-sm opacity-90">{message}</div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-2 py-1 rounded-md hover:bg-black/5"
          aria-label="Close"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

export default function ApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inline UX messages (no more alert())
  const [banner, setBanner] = useState(null); // { type, title, message }

  // Create form
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Table controls
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Busy states (VG polish)
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rowBusyId, setRowBusyId] = useState(null); // used for status change + delete

  const safeSetBanner = (next) => {
    setBanner(next);
    if (next) {
      // auto-dismiss success/info after a bit (keep errors until closed)
      if (next.type !== "error") {
        window.clearTimeout(safeSetBanner._t);
        safeSetBanner._t = window.setTimeout(() => setBanner(null), 2500);
      }
    }
  };

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await listApplications();
      setItems(Array.isArray(data) ? data : []);
      if (silent) return;
    } catch (e) {
      safeSetBanner({
        type: "error",
        title: "Failed to load applications",
        message: e?.message || "Please try again.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((a) => {
      const matchesQuery =
        !query ||
        String(a.job_title || "")
          .toLowerCase()
          .includes(query) ||
        String(a.company || "")
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "ALL" ||
        String(a.status || "APPLIED") === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, q, statusFilter]);

  const stats = useMemo(() => {
    const counts = {
      total: items.length,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };
    for (const a of items) {
      const s = String(a.status || "APPLIED");
      if (counts[s] !== undefined) counts[s] += 1;
    }
    return counts;
  }, [items]);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    setBanner(null);

    try {
      const created = await createApplication({
        job_title: jobTitle,
        company,
        job_url: jobUrl.trim() ? jobUrl.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      // optimistic insert
      setItems((prev) => [created, ...prev]);

      // reset form
      setJobTitle("");
      setCompany("");
      setJobUrl("");
      setNotes("");

      safeSetBanner({
        type: "success",
        title: "Application added",
        message: "Saved successfully.",
      });
    } catch (e2) {
      safeSetBanner({
        type: "error",
        title: "Failed to add application",
        message: e2?.message || "Please try again.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    if (rowBusyId) return;
    setRowBusyId(id);
    setBanner(null);

    // optimistic update
    const prevItems = items;
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
    );

    try {
      const updated = await updateApplication(id, { status: newStatus });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      safeSetBanner({
        type: "success",
        title: "Status updated",
        message: `Set to ${newStatus}.`,
      });
    } catch (e) {
      // rollback
      setItems(prevItems);
      safeSetBanner({
        type: "error",
        title: "Failed to update status",
        message: e?.message || "Please try again.",
      });
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (rowBusyId) return;
    if (!confirm("Delete this application?")) return;

    setRowBusyId(id);
    setBanner(null);

    // optimistic remove
    const prevItems = items;
    setItems((prev) => prev.filter((x) => x.id !== id));

    try {
      await deleteApplication(id);
      safeSetBanner({
        type: "success",
        title: "Deleted",
        message: "Application removed.",
      });
    } catch (e) {
      // rollback
      setItems(prevItems);
      safeSetBanner({
        type: "error",
        title: "Failed to delete",
        message: e?.message || "Please try again.",
      });
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Applications</h1>
        <p className="text-slate-600">
          Track your job applications and update status.
        </p>
      </div>

      {banner ? (
        <Banner
          type={banner.type}
          title={banner.title}
          message={banner.message}
          onClose={() => setBanner(null)}
        />
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Applied" value={stats.APPLIED} />
        <StatCard label="Interview" value={stats.INTERVIEW} />
        <StatCard label="Offer" value={stats.OFFER} />
        <StatCard label="Rejected" value={stats.REJECTED} />
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            className="w-full p-3 border rounded-md"
            placeholder="Job title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
            disabled={creating}
          />
          <input
            className="w-full p-3 border rounded-md"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            disabled={creating}
          />
          <input
            className="w-full p-3 border rounded-md md:col-span-2"
            placeholder="Job URL (optional)"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            disabled={creating}
          />
        </div>

        <textarea
          className="w-full p-3 border rounded-md h-24"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={creating}
        />

        <button
          type="submit"
          disabled={creating}
          className={cn(
            "bg-slate-900 text-white px-5 py-2 rounded-md transition",
            creating ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-800"
          )}
        >
          {creating ? "Adding..." : "Add application"}
        </button>
      </form>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Your applications</h2>
            <div className="text-sm text-slate-500">
              Showing {filtered.length} of {items.length}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="w-full md:w-64 p-2 border rounded-md"
              placeholder="Search job/company..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="w-full md:w-40 p-2 border rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className={cn(
                "px-4 py-2 rounded-md border border-slate-200 text-sm",
                refreshing
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-slate-50"
              )}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-slate-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-slate-600">
            No applications match your filters.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-6 py-3">Job</th>
                <th className="text-left px-6 py-3">Company</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const busy = rowBusyId === a.id;
                const url = (a.job_url || "").trim();
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-6 py-3 font-medium text-slate-900">
                      <div>{a.job_title}</div>
                      {a.notes ? (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {a.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-3">{a.company}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                          {String(a.status || "APPLIED")}
                        </span>
                        <select
                          className="border rounded-md px-2 py-1"
                          value={String(a.status || "APPLIED")}
                          onChange={(e) =>
                            handleStatusChange(a.id, e.target.value)
                          }
                          disabled={busy}
                          title={busy ? "Saving..." : "Change status"}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        {busy ? (
                          <span className="text-xs text-slate-500">
                            Saving…
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-700 hover:underline"
                          >
                            Open link
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          disabled={busy}
                          className={cn(
                            "text-red-600 hover:underline",
                            busy ? "opacity-60 cursor-not-allowed" : ""
                          )}
                          title={busy ? "Working..." : "Delete"}
                        >
                          {busy ? "Working…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
