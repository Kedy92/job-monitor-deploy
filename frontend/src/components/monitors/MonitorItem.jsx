import { useState } from "react";
import { Trash2, Tag, ExternalLink, Pencil, Check, X } from "lucide-react";

const MONITOR_TYPES = [
  { value: "job", label: "Job" },
  { value: "housing", label: "Housing" },
  { value: "appointment", label: "Appointment" },
];

function siteName(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return url;
  }
}

export default function MonitorItem({ monitor, onDelete, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(monitor.name);
  const [targetUrl, setTargetUrl] = useState(monitor.target_url);
  const [monitorType, setMonitorType] = useState(monitor.monitor_type);
  const [intervalMinutes, setIntervalMinutes] = useState(monitor.interval_minutes);
  const [keywords, setKeywords] = useState(monitor.keywords || "");
  const [matchThreshold, setMatchThreshold] = useState(monitor.match_threshold ?? 60);

  const displayKeywords = (monitor.keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  function handleCancel() {
    setName(monitor.name);
    setTargetUrl(monitor.target_url);
    setMonitorType(monitor.monitor_type);
    setIntervalMinutes(monitor.interval_minutes);
    setKeywords(monitor.keywords || "");
    setMatchThreshold(monitor.match_threshold ?? 60);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onEdit(monitor.id, {
        name: name.trim(),
        target_url: targetUrl.trim(),
        monitor_type: monitorType,
        interval_minutes: Number(intervalMinutes),
        keywords: keywords.trim(),
        match_threshold: Number(matchThreshold),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="card p-4 space-y-3 border-indigo-200 ring-1 ring-indigo-100">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-indigo-700">Editing monitor</span>
          <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="input"
            placeholder="Monitor name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="input"
            value={monitorType}
            onChange={(e) => setMonitorType(e.target.value)}
          >
            {MONITOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <input
            className="input md:col-span-2"
            placeholder="Target URL"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />

          <input
            className="input md:col-span-2"
            placeholder="Keywords, comma separated"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              className="input"
              placeholder="Interval (min)"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 whitespace-nowrap">Threshold:</label>
            <input
              type="number"
              min="1"
              max="100"
              className="input"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(e.target.value)}
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary py-1.5 px-4"
          >
            <Check size={14} />
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={handleCancel} className="btn-secondary py-1.5 px-4">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 flex justify-between items-start gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-slate-900 truncate">{monitor.name}</span>

          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            monitor.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {monitor.active ? "Active" : "Paused"}
          </span>

          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
            {monitor.monitor_type}
          </span>
        </div>

        <a
          href={monitor.target_url}
          target="_blank"
          rel="noreferrer"
          title={monitor.target_url}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors w-fit"
        >
          <ExternalLink size={11} />
          {siteName(monitor.target_url)}
        </a>

        {displayKeywords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={12} className="text-slate-400" />
            {displayKeywords.map((k) => (
              <span key={k} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {k}
              </span>
            ))}
            <span className="text-xs text-slate-400">
              — threshold {monitor.match_threshold ?? 60}%
            </span>
          </div>
        )}

        {displayKeywords.length === 0 && (
          <p className="text-xs text-amber-600">No keywords set — email will not trigger.</p>
        )}

        <div className="text-xs text-slate-400">
          Checks every {monitor.interval_minutes} min
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-indigo-50"
          title="Edit monitor"
        >
          <Pencil size={14} />
        </button>

        <button
          onClick={() => onToggle(monitor)}
          className={`text-sm font-medium px-3 py-1 rounded-lg border transition-colors ${
            monitor.active
              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          {monitor.active ? "Pause" : "Activate"}
        </button>

        <button
          onClick={() => onDelete(monitor.id)}
          className="btn-danger py-1 px-2"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
