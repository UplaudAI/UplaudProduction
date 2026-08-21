const AUTH_KEY = "uplaud_business_auth_v1";
const IMPORTED_KEY = "uplaud_business_imported_v1";
const SEEN_LEADS_KEY = "uplaud_business_seen_leads_v1";

function normalizeAuth(auth) {
  if (!auth || typeof auth !== "object") return null;
  const email = typeof auth.email === "string" ? auth.email : "";
  const fallbackName = email && email.includes("@") ? email.split("@")[0] : "User";
  return {
    ...auth,
    name: auth.name || fallbackName,
    workspace: auth.workspace || auth.company || "My Company",
  };
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? normalizeAuth(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function setAuth(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(normalizeAuth(user)));
}

export function updateAuth(updates) {
  const current = getAuth() || {};
  const next = normalizeAuth({ ...current, ...(updates || {}) });
  localStorage.setItem(AUTH_KEY, JSON.stringify(next));
  return next;
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

export function getSeenLeadsCount() {
  return Number(localStorage.getItem(SEEN_LEADS_KEY) || 0);
}

export function setSeenLeadsCount(value) {
  localStorage.setItem(SEEN_LEADS_KEY, String(value || 0));
}

export function resetBusinessState() {
  clearAuth();
  localStorage.removeItem(IMPORTED_KEY);
  localStorage.removeItem(SEEN_LEADS_KEY);
}
