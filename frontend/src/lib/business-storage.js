const AUTH_KEY = "uplaud_business_auth_v1";
const IMPORTED_KEY = "uplaud_business_imported_v1";
const SEEN_LEADS_KEY = "uplaud_business_seen_leads_v1";
const DOMAIN_PREFS_KEY = "uplaud_business_domain_prefs_v1";

function getDomainPrefs() {
  try {
    return JSON.parse(localStorage.getItem(DOMAIN_PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDomainPref(email, brandDomain) {
  if (!email || !brandDomain) return;
  const prefs = getDomainPrefs();
  prefs[email.toLowerCase().trim()] = brandDomain;
  localStorage.setItem(DOMAIN_PREFS_KEY, JSON.stringify(prefs));
}

function clearDomainPref(email) {
  if (!email) return;
  const prefs = getDomainPrefs();
  delete prefs[email.toLowerCase().trim()];
  localStorage.setItem(DOMAIN_PREFS_KEY, JSON.stringify(prefs));
}

function normalizeAuth(auth) {
  if (!auth || typeof auth !== "object") return null;
  const email = typeof auth.email === "string" ? auth.email : "";
  const fallbackName = email && email.includes("@") ? email.split("@")[0] : "User";
  const savedBrandDomain = email ? getDomainPrefs()[email.toLowerCase().trim()] : "";
  const hasExplicitBrandDomain =
    Object.prototype.hasOwnProperty.call(auth, "brandDomain") ||
    Object.prototype.hasOwnProperty.call(auth, "selected_brand_domain");
  const brandDomain = hasExplicitBrandDomain
    ? (auth.brandDomain || auth.selected_brand_domain || "")
    : (savedBrandDomain || "");
  return {
    ...auth,
    name: auth.name || fallbackName,
    workspace: auth.workspace || auth.company || "My Company",
    company: auth.company || auth.workspace || "My Company",
    brandDomain,
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
  const next = normalizeAuth(user);
  if (next?.brandDomain) saveDomainPref(next.email, next.brandDomain);
  else clearDomainPref(next?.email);
  localStorage.setItem(AUTH_KEY, JSON.stringify(next));
}

export function updateAuth(updates) {
  const current = getAuth() || {};
  const next = normalizeAuth({ ...current, ...(updates || {}) });
  if (next?.brandDomain) saveDomainPref(next.email, next.brandDomain);
  else if (
    updates &&
    (Object.prototype.hasOwnProperty.call(updates, "brandDomain") ||
      Object.prototype.hasOwnProperty.call(updates, "selected_brand_domain"))
  ) {
    clearDomainPref(next?.email);
  }
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
