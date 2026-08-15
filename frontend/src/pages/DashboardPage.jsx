import { useEffect, useMemo, useState } from "react";
import { Activity, Briefcase, CheckCircle2, Radio, Sparkles } from "lucide-react";
import MonitorForm from "../components/monitors/MonitorForm";
import MonitorList from "../components/monitors/MonitorList";
import ErrorBanner from "../components/ui/ErrorBanner";
import { LoadingLine, SkeletonCard } from "../components/ui/Loading";
import { createApplication, getApplicationStats } from "../api/applications";
import { getMonitorRuns } from "../api/monitors";
import { useMonitors } from "../hooks/useMonitors";

function StatCard({ label, value, icon, tone = "indigo" }) {
  const IconComponent = icon;
  const tones = {
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    slate: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
        <IconComponent size={16} className="opacity-70" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    monitors,
    loading,
    error,
    setError,
    addMonitor,
    removeMonitor,
    toggleMonitor,
    editMonitor,
  } = useMonitors();
  const [applicationStats, setApplicationStats] = useState(null);
  const [latestRuns, setLatestRuns] = useState([]);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState(null);

  useEffect(() => {
    getApplicationStats().then(setApplicationStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!monitors.length) {
      return;
    }

    Promise.all(monitors.slice(0, 6).map((monitor) => getMonitorRuns(monitor.id).catch(() => [])))
      .then((groups) => {
        const runs = groups
          .flat()
          .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime());
        setLatestRuns(runs.slice(0, 3));
      });
  }, [monitors]);

  const monitorStats = useMemo(() => {
    const active = monitors.filter((m) => m.active).length;
    const latest = monitors.length ? latestRuns[0]?.status || "none" : "none";
    return { active, latest };
  }, [monitors, latestRuns]);

  async function handleCreateDemoData() {
    setCreatingDemo(true);
    setDemoMessage(null);
    try {
      const demoMonitor = await addMonitor({
        name: "Junior Python Developer",
        target_url: "https://example.com",
        monitor_type: "job",
        interval_minutes: 10,
        keywords: "Python, FastAPI, React, SQL, Docker, REST API, AWS",
        match_threshold: 50,
        active: true,
      });
      await createApplication({
        job_title: "Junior Python Developer",
        company: "AI-Sweden Demo",
        job_url: demoMonitor.target_url,
        notes: "Demo application created from Job Monitor sample data.",
        applied_at: new Date().toISOString().slice(0, 10),
      });
      const stats = await getApplicationStats();
      setApplicationStats(stats);
      setDemoMessage("Demo monitor and application created.");
    } catch (err) {
      setDemoMessage(err?.message || "Failed to create demo data.");
    } finally {
      setCreatingDemo(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Radio size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monitors</h1>
            <p className="text-sm text-slate-500">
              Create monitors and control whether they are active or paused.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCreateDemoData}
          disabled={creatingDemo}
          className="btn-secondary shrink-0"
        >
          <Sparkles size={16} />
          {creatingDemo ? "Creating demo..." : "Create demo data"}
        </button>
      </header>

      <ErrorBanner
        title="Request failed"
        message={error}
        onClose={() => setError(null)}
      />

      {demoMessage && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {demoMessage}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active Monitors"
          value={`${monitorStats.active}/${monitors.length}`}
          icon={Radio}
          tone="indigo"
        />
        <StatCard
          label="Applications"
          value={applicationStats?.total ?? "—"}
          icon={Briefcase}
          tone="blue"
        />
        <StatCard
          label="Interviews + Offers"
          value={(applicationStats?.INTERVIEW ?? 0) + (applicationStats?.OFFER ?? 0)}
          icon={Sparkles}
          tone="emerald"
        />
        <StatCard
          label="Latest Check"
          value={monitorStats.latest}
          icon={monitorStats.latest === "match" ? CheckCircle2 : Activity}
          tone="slate"
        />
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Create monitor</h2>
        <MonitorForm onCreate={addMonitor} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Your monitors</h2>

        {loading && (
          <>
            <LoadingLine label="Fetching monitors..." />
            <div className="grid gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </>
        )}

        {!loading && (
          <MonitorList
            monitors={monitors}
            onDelete={removeMonitor}
            onToggle={toggleMonitor}
            onEdit={editMonitor}
          />
        )}
      </section>
    </div>
  );
}
