import { useState } from "react";

const MONITOR_TYPES = [
  { value: "job", label: "Job" },
  { value: "housing", label: "Housing" },
  { value: "appointment", label: "Appointment" },
];

export default function MonitorForm({ onCreate }) {
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [monitorType, setMonitorType] = useState("job");

  async function handleSubmit(e) {
    e.preventDefault();

    await onCreate({
      name: name.trim(),
      target_url: targetUrl.trim(),
      monitor_type: monitorType, // ✅ REQUIRED by backend
      interval_minutes: Number(intervalMinutes),
      active: true,
    });

    setName("");
    setTargetUrl("");
    setIntervalMinutes(10);
    setMonitorType("job");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        className="p-2 rounded-md bg-white text-slate-900 border border-slate-300 w-full placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="Monitor name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="p-2 rounded-md bg-white text-slate-900 border border-slate-300 w-full placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="Target URL"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
      />

      <select
        className="p-2 rounded-md bg-white text-slate-900 border border-slate-300 w-full focus:outline-none focus:ring-2 focus:ring-slate-400"
        value={monitorType}
        onChange={(e) => setMonitorType(e.target.value)}
      >
        {MONITOR_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <input
        type="number"
        min="1"
        className="p-2 rounded-md bg-white text-slate-900 border border-slate-300 w-full placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
        placeholder="Interval minutes"
        value={intervalMinutes}
        onChange={(e) => setIntervalMinutes(e.target.value)}
      />

      <button className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition">
        Create Monitor
      </button>
    </form>
  );
}
