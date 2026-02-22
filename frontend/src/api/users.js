import { api } from "./client";

export function getMe() {
  return api.get("/users/me");
}