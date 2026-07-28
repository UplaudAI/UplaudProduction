import axios from "axios";
import { toast } from "sonner";
import { clearAuth } from "@/lib/business-storage";

export const BACKEND = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API = `${BACKEND}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("uplaud_business_auth_v1");
    const auth = raw ? JSON.parse(raw) : null;
    if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  } catch {
    /* ignore */
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginCall =
      error.config?.url?.includes("/auth/login") ||
      error.config?.url?.includes("/session/login");
    if (error.response?.status === 401 && typeof window !== "undefined" && !isLoginCall) {
      clearAuth();
      if (window.location.pathname !== "/business") {
        toast.error("Your session expired — please sign in again.");
        setTimeout(() => {
          window.location.href = "/business";
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
