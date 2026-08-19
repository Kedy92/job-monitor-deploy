import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase, Plus, RefreshCw, Trash2, FileText,
  ExternalLink, Search, ChevronDown, Pencil, Check, X,
} from "lucide-react";
import {
  getApplicationStats,
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../api/applications";

const STATUS_OPTIONS = ["APPLIED", "INTERVIEW", "OFFER", "REJECTED"];

const STATUS_STYLES = {
  APPLIED:   "bg-blue-100 text-blue-700",
  INTERVIEW: "bg-yellow-100 text-yellow-700",
  OFFER:     "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-600",
};

const SCORE_STYLE = (score) => {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-600";
};

const PAGE_SIZE = 50;

function cn(...classes) { return classes.filter(Boolean).join(" "); }

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function StatCard({ label, value, color = "indigo" }) {
  const colors = {
    indigo:  "border-indigo-100 bg-indigo-50 text-indigo-700",
    blue:    "border-blue-100 bg-blue-50 text-blue-700",
    yellow:  "border-yellow-100 bg-yellow-50 text-yellow-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    red:     "border-red-100 bg-red-50 text-red-600",
  };
  return (
    <div className={cn("rounded-xl border p-4", colors[color])}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Banner({ type = "info", title, message, onClose }) {
  const styles = {
    error:   "border-red-200 bg-red-50 text-red-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    info:    "border-indigo-200 bg-indigo-50 text-indigo-900",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 flex items-start gap-3", styles[type] || styles.info)}>
      <div className="flex-1">
        {title && <div className="font-semibold text-sm">{title}</div>}
        <div className="text-sm opacity-90">{message}</div>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="text-sm px-2 py-1 rounded-md hover:bg-black/5">✕</button>
      )}
    </div>
  );
}

// Inline edit row — replaces the normal <tr> when editing
function EditRow({ a, colSpan, onSave, onCancel }) {
  const [jobTitle, setJobTitle]   = useState(a.job_title || "");
  const [company, setCompany]     = useState(a.company || "");
  const [jobUrl, setJobUrl]       = useState(a.job_url || "");
  const [notes, setNotes]         = useState(a.notes || "");
  const [appliedAt, setAppliedAt] = useState(a.applied_at || "");
  const [saving, setSaving]       = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(a.id, {
        job_title: jobTitle.trim(),
        company: company.trim(),
        job_url: jobUrl.trim() || null,
        notes: notes.trim() || null,
        applied_at: appliedAt || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-indigo-100 bg-indigo-50/40">
      <td colSpan={colSpan} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Job title *"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
          <input
            className="input"
            placeholder="Company *"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="input md:col-span-2"
            placeholder="Job URL (optional)"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Date applied</label>
            <input
              type="date"
              className="input"
              value={appliedAt}
              onChange={(e) => setAppliedAt(e.target.value)}
            />
          </div>
          <textarea
            className="input h-16 resize-none"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSave}
            disabled={saving || !jobTitle.trim() || !company.trim()}
            className="btn-primary py-1.5 px-4"
          >
            <Check size={14} />
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onCancel} className="btn-secondary py-1.5 px-4">
            <X size={14} />
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ApplicationsPage() {
  const [items, setItems]           = useState([]);
  const [stats, setStats]           = useState({ total: 0, APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 });
  const [loading, setLoading]       = useState(true);
  const [hasMore, setHasMore]       = useState(false);
  const [page, setPage]             = useState(0);
  const [banner, setBanner]         = useState(null);

  // Create form
  const [jobTitle, setJobTitle]     = useState("");
  const [company, setCompany]       = useState("");
  const [jobUrl, setJobUrl]         = useState("");
  const [notes, setNotes]           = useState("");
  const [appliedAt, setAppliedAt]   = useState(todayDateInputValue);
  const [showForm, setShowForm]     = useState(false);

  // Table controls
  const [q, setQ]                           = useState("");
  const [statusFilter, setStatusFilter]     = useState("ALL");
  const [creating, setCreating]             = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [rowBusyId, setRowBusyId]           = useState(null);
  const [editingId, setEditingId]           = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const bannerTimeoutRef = useRef(null);

  const safeSetBanner = useCallback((next) => {
    setBanner(next);
    if (next && next.type !== "error") {
      window.clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = window.setTimeout(() => setBanner(null), 3000);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getApplicationStats();
      setStats(data);
    } catch { /* non-critical */ }
  }, []);

  const loadPage = useCallback(async (pageIndex, silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await listApplications({ skip: pageIndex * PAGE_SIZE, limit: PAGE_SIZE });
      const arr = Array.isArray(data) ? data : [];
      setItems((prev) => pageIndex === 0 ? arr : [...prev, ...arr]);
      setHasMore(arr.length === PAGE_SIZE);
      setPage(pageIndex);
    } catch (e) {
      safeSetBanner({ type: "error", title: "Failed to load applications", message: e?.message || "Please try again." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [safeSetBanner]);

  useEffect(() => {
    loadPage(0);
    loadStats();
    return () => window.clearTimeout(bannerTimeoutRef.current);
  }, [loadPage, loadStats]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((a) => {
      const matchesQuery =
        !query ||
        String(a.job_title || "").toLowerCase().includes(query) ||
        String(a.company || "").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || String(a.status || "APPLIED") === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, q, statusFilter]);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setBanner(null);
    try {
      const created = await createApplication({
        job_title: jobTitle,
        company,
        job_url: jobUrl.trim() || null,
        notes: notes.trim() || null,
        applied_at: appliedAt || todayDateInputValue(),
      });
      setItems((prev) => [created, ...prev]);
      setJobTitle(""); setCompany(""); setJobUrl(""); setNotes(""); setAppliedAt(todayDateInputValue());
      setShowForm(false);
      await loadStats();
      safeSetBanner({
        type: "success",
        title: "Application added",
        message: created.match_score != null
          ? `Saved. Auto match score: ${created.match_score}%`
          : "Saved successfully.",
      });
    } catch (e2) {
      safeSetBanner({ type: "error", title: "Failed to add application", message: e2?.message || "Please try again." });
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(id, payload) {
    try {
      const updated = await updateApplication(id, payload);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setEditingId(null);
      safeSetBanner({ type: "success", title: "Application updated", message: "Changes saved." });
    } catch (e) {
      safeSetBanner({ type: "error", title: "Failed to update", message: e?.message || "Please try again." });
      throw e;
    }
  }

  async function handleStatusChange(id, newStatus) {
    if (rowBusyId) return;
    setRowBusyId(id);
    const prevItems = items;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
    try {
      const updated = await updateApplication(id, { status: newStatus });
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      await loadStats();
      safeSetBanner({ type: "success", title: "Status updated", message: `Set to ${newStatus}.` });
    } catch (e) {
      setItems(prevItems);
      safeSetBanner({ type: "error", title: "Failed to update status", message: e?.message || "Please try again." });
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (rowBusyId) return;
    setRowBusyId(id);
    const prevItems = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteApplication(id);
      await loadStats();
      safeSetBanner({ type: "success", title: "Deleted", message: "Application removed." });
    } catch (e) {
      setItems(prevItems);
      safeSetBanner({ type: "error", title: "Failed to delete", message: e?.message || "Please try again." });
    } finally {
      setRowBusyId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Briefcase size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
            <p className="text-sm text-slate-500">Track your job applications and update status.</p>
          </div>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          <Plus size={16} />
          {showForm ? "Cancel" : "Add application"}
        </button>
      </div>

      {banner && (
        <Banner type={banner.type} title={banner.title} message={banner.message} onClose={() => setBanner(null)} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total"     value={stats.total}     color="indigo" />
        <StatCard label="Applied"   value={stats.APPLIED}   color="blue" />
        <StatCard label="Interview" value={stats.INTERVIEW} color="yellow" />
        <StatCard label="Offer"     value={stats.OFFER}     color="emerald" />
        <StatCard label="Rejected"  value={stats.REJECTED}  color="red" />
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" /> New application
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input" placeholder="Job title *" value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)} required disabled={creating} />
            <input className="input" placeholder="Company *" value={company}
              onChange={(e) => setCompany(e.target.value)} required disabled={creating} />
            <input className="input md:col-span-2" placeholder="Job URL (optional — auto-scores on save)"
              value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} disabled={creating} />
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Date applied</label>
              <input type="date" className="input" value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)} disabled={creating} />
            </div>
            <textarea className="input h-20 resize-none" placeholder="Notes (optional)"
              value={notes} onChange={(e) => setNotes(e.target.value)} disabled={creating} />
          </div>
          <button type="submit" disabled={creating} className="btn-primary">
            <Plus size={16} />
            {creating ? "Adding..." : "Save application"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Your applications</h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Showing {filtered.length} of {stats.total}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-8 md:w-56" placeholder="Search job or company..."
                value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input md:w-40" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => { loadPage(0, true); loadStats(); }}
              disabled={refreshing} className="btn-secondary">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Briefcase size={32} className="mx-auto text-slate-300" />
            <p className="text-slate-500 text-sm">No applications match your filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3">Job</th>
                <th className="text-left px-6 py-3">Company</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Score</th>
                <th className="text-left px-6 py-3">Applied</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const busy   = rowBusyId === a.id;
                const url    = (a.job_url || "").trim();
                const status = String(a.status || "APPLIED");
                const isEditing = editingId === a.id;
                const isConfirmingDelete = confirmDeleteId === a.id;

                return isEditing ? (
                  <EditRow
                    key={a.id}
                    a={a}
                    colSpan={6}
                    onSave={handleEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{a.job_title}</div>
                      {a.notes && (
                        <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.notes}</div>
                      )}
                      {a.status_changed_at && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Status updated: {new Date(a.status_changed_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-600">{a.company}</td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", STATUS_STYLES[status] || "bg-slate-100 text-slate-600")}>
                          {status}
                        </span>
                        <select
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          disabled={busy}
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {busy && <span className="text-xs text-slate-400">Saving…</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {a.match_score != null ? (
                        <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium", SCORE_STYLE(a.match_score))}>
                          {a.match_score}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(a.applied_at || a.created_at) || <span className="text-slate-300">—</span>}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setEditingId(a.id)}
                          disabled={isConfirmingDelete}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
                          title="Edit application"
                        >
                          <Pencil size={13} />
                        </button>
                        <Link to={`/app/cv-builder/${a.id}`} className={isConfirmingDelete ? "pointer-events-none opacity-50" : ""}>
                          <button className="btn-secondary py-1 px-2 text-xs">
                            <FileText size={13} /> CV
                          </button>
                        </Link>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("btn-secondary py-1 px-2 text-xs", isConfirmingDelete && "pointer-events-none opacity-50")}
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        {isConfirmingDelete ? (
                          <div className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2 py-1">
                            <span className="text-xs font-medium text-red-700">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              disabled={busy}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={busy}
                              className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(a.id)}
                            disabled={busy}
                            className="btn-danger py-1 px-2 text-xs"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {hasMore && !loading && (
          <div className="px-6 py-4 border-t border-slate-100 text-center">
            <button
              onClick={() => loadPage(page + 1, true)}
              disabled={refreshing}
              className="btn-secondary"
            >
              {refreshing ? (
                <><RefreshCw size={14} className="animate-spin" /> Loading...</>
              ) : (
                <><ChevronDown size={14} /> Load more</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
