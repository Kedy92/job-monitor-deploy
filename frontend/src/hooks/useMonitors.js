import { useEffect, useState } from "react";
import { getMonitors, createMonitor, deleteMonitor, updateMonitor } from "../api/monitors";

export function useMonitors() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getMonitors();
      setMonitors(data);
      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to load monitors");
    } finally {
      setLoading(false);
    }
  }

  async function addMonitor(payload) {
    try {
      const created = await createMonitor(payload);
      setMonitors((prev) => [created, ...prev]);
      setError(null);
      return created;
    } catch (err) {
      setError(err?.message || "Failed to create monitor");
      throw err;
    }
  }

  async function removeMonitor(id) {
    try {
      await deleteMonitor(id);
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      setError(null);
    } catch (err) {
      setError(err?.message || "Failed to delete monitor");
      throw err;
    }
  }

  async function toggleMonitor(monitor) {
    try {
      const updated = await updateMonitor(monitor.id, { active: !monitor.active });
      setMonitors((prev) => prev.map((m) => (m.id === monitor.id ? updated : m)));
      setError(null);
      return updated;
    } catch (err) {
      setError(err?.message || "Failed to update monitor");
      throw err;
    }
  }

  async function editMonitor(id, payload) {
    try {
      const updated = await updateMonitor(id, payload);
      setMonitors((prev) => prev.map((m) => (m.id === id ? updated : m)));
      setError(null);
      return updated;
    } catch (err) {
      setError(err?.message || "Failed to update monitor");
      throw err;
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    monitors,
    loading,
    error,
    reload: load,
    addMonitor,
    removeMonitor,
    toggleMonitor,
    editMonitor,
  };
}