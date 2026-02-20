import { apiFetch } from "./client";

export function getMe() {
  return apiFetch("/users/me");
}