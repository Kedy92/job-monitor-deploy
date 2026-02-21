import { useState, useEffect } from "react";
import { login, register, logout } from "./api/auth";
import { listMonitors, createMonitor, deleteMonitor } from "./api/monitors";

export default function App() {
  // --------------------
  // AUTH STATE
  // --------------------
  const [email, setEmail] = useState("osman@test.com");
  const [password, setPassword] = useState("hello123");
  const [token, setToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // --------------------
  // MONITORS STATE
  // --------------------
  const [monitors, setMonitors] = useState([]);
  const [monitorsLoading, setMonitorsLoading] = useState(false);

  // --------------------
  // CREATE FORM
  // --------------------
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [monitorType, setMonitorType] = useState("job");
  const [intervalMinutes, setIntervalMinutes] = useState(10);
  const [active, setActive] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  const [error, setError] = useState("");

  // --------------------
  // AUTO LOGIN ON REFRESH
  // --------------------
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // --------------------
  // LOAD MONITORS WHEN TOKEN CHANGES
  // --------------------
  useEffect(() => {
    if (!token) return;

    async function fetchMonitors() {
      setMonitorsLoading(true);
      try {
        const ms = await listMonitors(token);
        setMonitors(ms);
      } catch (e) {
        setError(e?.message || "Failed to load monitors");
      } finally {
        setMonitorsLoading(false);
      }
    }

    fetchMonitors();
  }, [token]);

  // --------------------
  // AUTH HANDLERS
  // --------------------
  async function handleLogin() {
    setError("");
    setAuthLoading(true);

    try {
      const data = await login(email, password);
      setToken(data.access_token);
    } catch (e) {
      setError(e?.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister() {
    setError("");
    setAuthLoading(true);

    try {
      await register(email, password);
      const data = await login(email, password);
      setToken(data.access_token);
    } catch (e) {
      setError(e?.message || "Register failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setToken("");
    setMonitors([]);
  }

  // --------------------
  // CREATE
  // --------------------
  async function handleCreate() {
    if (!token) return;

    setError("");
    setCreateLoading(true);

    try {
      const created = await createMonitor(token, {
        name,
        target_url: targetUrl,
        monitor_type: monitorType,
        interval_minutes: Number(intervalMinutes),
        active,
      });

      setMonitors((prev) => [created, ...prev]);
      setName("");
      setTargetUrl("");
    } catch (e) {
      setError(e?.message || "Create failed");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!token) return;

    try {
      await deleteMonitor(token, id);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e?.message || "Delete failed");
    }
  }

  // --------------------
  // UI
  // --------------------
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Job Monitor</h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {/* AUTH */}
        <div className="mt-8 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-xl font-semibold">Authentication</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-lg bg-zinc-900 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
            <input
              className="rounded-lg bg-zinc-900 px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="rounded-lg bg-white text-zinc-900 px-4 py-2 font-semibold disabled:opacity-40"
            >
              {authLoading ? "Loading..." : "Login"}
            </button>

            <button
              onClick={handleRegister}
              disabled={authLoading}
              className="rounded-lg border border-zinc-700 px-4 py-2 disabled:opacity-40"
            >
              Register
            </button>

            {token && (
              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-700 px-4 py-2"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* CREATE */}
        {token && (
          <div className="mt-8 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-xl font-semibold">Create Monitor</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-lg bg-zinc-900 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="rounded-lg bg-zinc-900 px-3 py-2"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Target URL"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={createLoading}
              className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 font-semibold disabled:opacity-40"
            >
              {createLoading ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {/* LIST */}
        {token && (
          <div className="mt-8 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-xl font-semibold">My Monitors</h2>

            {monitorsLoading && (
              <p className="mt-4 text-zinc-400">Loading monitors...</p>
            )}

            {!monitorsLoading && monitors.length === 0 && (
              <p className="mt-4 text-zinc-500">No monitors yet.</p>
            )}

            <div className="mt-4 space-y-3">
              {monitors.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-900 p-4"
                >
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-sm text-zinc-400">{m.target_url}</div>
                  </div>

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
