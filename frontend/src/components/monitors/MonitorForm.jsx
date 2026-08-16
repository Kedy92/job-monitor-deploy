import { useState } from "react";
import { Plus } from "lucide-react";

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
  const [keywords, setKeywords] = useState("");
  const [matchThreshold, setMatchThreshold] = useState(60);

  async function handleSubmit(e) {
    e.preventDefault();
    await onCreate({
      name: name.trim(),
      target_url: targetUrl.trim(),
      monitor_type: monitorType,
      interval_minutes: Number(intervalMinutes),
      active: true,
      keywords: keywords.trim(),
      match_threshold: Number(matchThreshold),
    });
    setName("");
    setTargetUrl("");
    setIntervalMinutes(10);
    setMonitorType("job");
    setKeywords("");
    setMatchThreshold(60);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="Monitor name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
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
          placeholder="Target URL (e.g. https://jobs.example.com/listings)"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          required
        />

        <input
          className="input md:col-span-2"
          placeholder="Keywords to match, comma separated (e.g. Python, React, Stockholm)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-600">
            Check interval
          </label>
          <input
            type="number"
            min="1"
            className="input"
            placeholder="10"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Runs automatically every {intervalMinutes || 0} minutes while active.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-600 whitespace-nowrap">
            Match threshold
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="100"
              className="input"
              placeholder="60"
              value={matchThreshold}
              onChange={(e) => setMatchThreshold(e.target.value)}
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary">
        <Plus size={16} />
        Create Monitor
      </button>
    </form>
  );
}
