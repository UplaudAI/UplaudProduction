import api from "@/lib/api";

export function logEvent(event, { page = "", shareId = "", details = "" } = {}) {
  try {
    api
      .post("/events/log", { event, page, share_id: shareId, details })
      .catch(() => {});
  } catch {
    /* never let analytics break the UI */
  }
}
