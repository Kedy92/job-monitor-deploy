import { logoutToLogin, getToken } from "../services/token";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  // FastAPI often returns JSON errors; handle both json & text safely
  if (contentType.includes("application/json")) {
    return await res.json().catch(() => null);
  }

  const text = await res.text().catch(() => "");
  return text || null;
}

function errorMessageFrom(data, fallback) {
  if (!data) return fallback;

  // FastAPI common shapes:
  // {detail: "msg"} or {detail: [{...validationErrors}]}
  if (typeof data === "string") return data;

  if (data.detail) {
    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
      // Validation errors -> build a readable message
      const first = data.detail[0];
      if (first?.msg) return first.msg;
      return "Validation error";
    }
  }

  if (data.message) return data.message;

  return fallback;
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };

  const authToken = token ?? getToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // 204 no content
  if (res.status === 204) return null;

  const data = await parseResponse(res);

  if (!res.ok) {
    const err = new Error(
      errorMessageFrom(data, `Request failed: ${res.status}`)
    );
    err.status = res.status;
    err.data = data;

    // ✅ critical: auto logout on expired/invalid token
    if (res.status === 401) {
      logoutToLogin();
    }

    throw err;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, opts) => request(path, { ...opts, method: "POST" }),
  put: (path, opts) => request(path, { ...opts, method: "PUT" }),
  patch: (path, opts) => request(path, { ...opts, method: "PATCH" }), // ✅ add this
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};