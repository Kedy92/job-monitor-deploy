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
        <h1 className="text-3xl font-bold text-slate-900">Monitors</h1>
        <p className="mt-1 text-slate-600">
          Create monitors and control whether they are active or paused.
        </p>
      </header>

      <ErrorBanner
        title="Request failed"
        message={error}
        onClose={() => setError(null)}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create monitor</h2>
        <div className="mt-4">
          <MonitorForm onCreate={addMonitor} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Your monitors</h2>

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
