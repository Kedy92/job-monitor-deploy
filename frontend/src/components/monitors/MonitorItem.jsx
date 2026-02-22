export default function MonitorItem({ monitor, onDelete, onToggle }) {
  const badgeClasses = monitor.active
    ? "bg-green-100 text-green-700"
    : "bg-slate-200 text-slate-700";

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex justify-between items-start gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-900 truncate">
            {monitor.name}
          </span>

          <span className={`text-xs px-2 py-1 rounded-full ${badgeClasses}`}>
            {monitor.active ? "Active" : "Paused"}
          </span>
        </div>

        <div className="text-sm text-slate-600 break-all mt-1">
          {monitor.target_url}
        </div>

        {typeof monitor.interval_minutes !== "undefined" &&
        monitor.interval_minutes !== null ? (
          <div className="text-xs text-slate-500 mt-2">
            Interval: {monitor.interval_minutes} min
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(monitor)}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          {monitor.active ? "Pause" : "Activate"}
        </button>

        <button
          onClick={() => onDelete(monitor.id)}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
