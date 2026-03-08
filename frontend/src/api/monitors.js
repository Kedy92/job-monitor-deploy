import { api } from "./client";

export function getMonitors() {
  return api.get("/monitors");
}

export function createMonitor(payload) {
  return api.post("/monitors", { body: payload });
}

export function updateMonitor(id, payload) {
  return api.put(`/monitors/${id}`, { body: payload });
}

export function deleteMonitor(id) {
  return api.del(`/monitors/${id}`);
}

export function getMonitorRuns(id) {
  return api.get(`/monitors/${id}/runs`);
}