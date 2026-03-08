import { api } from "./client";
import { getToken } from "../services/token";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function createCVVersion(data) {
  return await api.post("/cv-versions/", { body: data });
}

export async function getCVVersions(applicationId) {
  return await api.get(`/cv-versions/application/${applicationId}`);
}

export async function downloadCV(cvId) {
  const res = await fetch(`${API_BASE}/cv-versions/${cvId}/download`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cv_${cvId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}