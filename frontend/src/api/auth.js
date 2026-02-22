import { api } from "./client";

export function register(payload) {
  return api.post("/auth/register", { body: payload });
}

export function login(payload) {
  return api.post("/auth/login", { body: payload });
}