const AUTH_KEY = "uplaud_business_auth_v1";
const IMPORTED_KEY = "uplaud_business_imported_v1";

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export function getImported() {
  return localStorage.getItem(IMPORTED_KEY) === "true";
}

export function setImported(value) {
  localStorage.setItem(IMPORTED_KEY, value ? "true" : "false");
}

export function resetBusinessState() {
  clearAuth();
  localStorage.removeItem(IMPORTED_KEY);
}
