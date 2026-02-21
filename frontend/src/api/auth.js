import { api } from "./client";

export async function login(email, password) {
  const data = await api.post("/auth/login", {
    body: { email, password }, // object (no stringify)
  });

  localStorage.setItem("access_token", data.access_token);
  return data;
}

export async function register(email, password) {
  const data = await api.post("/auth/register", {
    body: { email, password },
  });

  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
}