const KEY = "token";

export function getToken() {
  return localStorage.getItem(KEY);
}

export function setToken(token) {
  localStorage.setItem(KEY, token);
}

export function clearToken() {
  localStorage.removeItem(KEY);
}

// Used by the API client on 401
export function logoutToLogin() {
  clearToken();
  // keep it simple + reliable for now (router-safe later)
  window.location.href = "/login";
}