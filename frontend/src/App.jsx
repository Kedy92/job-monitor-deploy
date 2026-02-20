import { useState } from "react";
import { login } from "./api/auth";
import { listMonitors, createMonitor, deleteMonitor } from "./api/monitors";

export default function App() {
  const [email, setEmail] = useState("osman@test.com");
  const [password, setPassword] = useState("hello123");
  const [token, setToken] = useState("");
  const [monitors, setMonitors] = useState([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("Test Monitor");
  const [targetUrl, setTargetUrl] = useState("https://example.com/");
  const [monitorType, setMonitorType] = useState("job");
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [active, setActive] = useState(true);

  async function handleLogin() {
    setError("");
    try {
      const data = await login(email, password);
      setToken(data.access_token);

      const ms = await listMonitors(data.access_token);
      setMonitors(ms);
    } catch (e) {
      setError(e?.message || "Login failed");
    }
  }

  async function handleCreate() {
    setError("");
    try {
      const created = await createMonitor(token, {
        name,
        target_url: targetUrl,
        monitor_type: monitorType,
        interval_minutes: Number(intervalMinutes),
        active,
      });
      setMonitors((prev) => [created, ...prev]);
    } catch (e) {
      setError(e?.message || "Create failed");
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deleteMonitor(token, id);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e?.message || "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Job Monitor</h1>
        <p className="mt-2 text-zinc-400">
          React + Tailwind frontend talking to FastAPI backend.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Login */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold">Login</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleLogin}
              className="rounded-lg bg-white px-4 py-2 text-zinc-900 font-semibold hover:opacity-90"
            >
              Login & Load monitors
            </button>

            {token && (
              <span className="text-sm text-green-300">
                Logged in ✓ token loaded
              </span>
            )}
          </div>
        </div>

        {/* Create */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold">Create Monitor</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name"
            />
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="target_url"
            />

            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={monitorType}
              onChange={(e) => setMonitorType(e.target.value)}
              placeholder="monitor_type (job/housing/appointment)"
            />
            <input
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
              placeholder="interval_minutes"
              type="number"
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            active
          </label>

          <button
            onClick={handleCreate}
            disabled={!token}
            className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-40"
          >
            Create monitor
          </button>
        </div>

        {/* List */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <h2 className="text-xl font-semibold">My monitors</h2>

          {!token && (
            <p className="mt-3 text-zinc-400">Login first to load monitors.</p>
          )}

          <div className="mt-4 space-y-3">
            {monitors.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {m.name}{" "}
                    <span className="text-xs text-zinc-400">#{m.id}</span>
                  </div>
                  <div className="text-sm text-zinc-400">{m.target_url}</div>
                  <div className="text-xs text-zinc-500">
                    {m.monitor_type} • every {m.interval_minutes} min •{" "}
                    {m.active ? "active" : "inactive"}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(m.id)}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
