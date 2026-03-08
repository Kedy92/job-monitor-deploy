import { api } from "./client";

export async function createCVVersion(data) {
  return await api.post("/cv-versions/", { body: data });
}

export async function getCVVersions(applicationId) {
  return await api.get(`/cv-versions/application/${applicationId}`);
}