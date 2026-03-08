import { api } from "./client";

const token = () => localStorage.getItem("token");

export function getApplicationStats() {
  return api.get("/applications/stats", { token: token() });
}

export function listApplications({ skip = 0, limit = 50 } = {}) {
  return api.get(`/applications/?skip=${skip}&limit=${limit}`, { token: token() });
}

export function getApplication(id) {
  return api.get(`/applications/${id}`, { token: token() });
}

export function createApplication(payload) {
  return api.post("/applications/", { token: token(), body: payload });
}

export function updateApplication(id, payload) {
  return api.patch(`/applications/${id}`, { token: token(), body: payload });
}

export function deleteApplication(id) {
  return api.del(`/applications/${id}`, { token: token() });
}
