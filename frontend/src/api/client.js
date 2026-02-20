const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.detail ? JSON.stringify(data.detail) : res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, opts) => request(path, { ...opts, method: "POST" }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export async function apiFetch(path, opts = {}) {
  return request(path, opts);
}