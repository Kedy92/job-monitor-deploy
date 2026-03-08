import { Radio } from "lucide-react";
import MonitorForm from "../components/monitors/MonitorForm";
import MonitorList from "../components/monitors/MonitorList";
import ErrorBanner from "../components/ui/ErrorBanner";
import { LoadingLine, SkeletonCard } from "../components/ui/Loading";
import { useMonitors } from "../hooks/useMonitors";

export default function DashboardPage() {
  const {
    monitors,
    loading,
    error,
    setError,
    addMonitor,
    removeMonitor,
    toggleMonitor,
  } = useMonitors();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
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
      </header>

      <ErrorBanner
        title="Request failed"
        message={error}
        onClose={() => setError(null)}
      />

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
          />
        )}
      </section>
    </div>
  );
}
