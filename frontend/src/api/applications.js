import { api } from "./client";

const token = () => localStorage.getItem("token");

export function listApplications() {
  return api.get("/applications/", { token: token() });
}

export function createApplication(payload) {
  return api.post("/applications/", {
    token: token(),
    body: payload,
  });
}

export function updateApplication(id, payload) {
  return api.patch(`/applications/${id}`, {
    token: token(),
    body: payload,
  });
}

export function deleteApplication(id) {
  return api.del(`/applications/${id}`, { token: token() });
}