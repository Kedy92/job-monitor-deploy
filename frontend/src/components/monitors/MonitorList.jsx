import MonitorItem from "./MonitorItem";

export default function MonitorList({ monitors, onDelete, onToggle, onEdit }) {
  if (!monitors.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
        No monitors yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {monitors.map((monitor) => (
        <MonitorItem
          key={monitor.id}
          monitor={monitor}
          onDelete={onDelete}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
