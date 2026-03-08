import { Trash2, Tag } from "lucide-react";

export default function MonitorItem({ monitor, onDelete, onToggle }) {
  const keywords = (monitor.keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

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

        <div className="text-sm text-slate-500 break-all">{monitor.target_url}</div>

        {keywords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={12} className="text-slate-400" />
            {keywords.map((k) => (
              <span key={k} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                {k}
              </span>
            ))}
            <span className="text-xs text-slate-400">
              — threshold {monitor.match_threshold ?? 60}%
            </span>
          </div>
        )}

        {keywords.length === 0 && (
          <p className="text-xs text-amber-600">No keywords set — email will not trigger.</p>
        )}

        <div className="text-xs text-slate-400">
          Checks every {monitor.interval_minutes} min
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
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
