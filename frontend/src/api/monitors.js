// frontend/src/api/monitors.js
import { api } from "./client";

export function listMonitors(token) {
  return api.get("/monitors", { token });
}

export function createMonitor(token, payload) {
  return api.post("/monitors", { token, body: payload });
}

export function deleteMonitor(token, id) {
  return api.del(`/monitors/${id}`, { token });
}