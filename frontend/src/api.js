/**
 * Small wrapper around fetch for every backend call.
 * VITE_API_URL comes from your .env file, e.g. http://localhost:8000
 */
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch (_) {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  health: () => fetch(`${BASE_URL}/api/health`).then(handle),

  classify: (file) => {
    const form = new FormData();
    form.append("image", file);
    return fetch(`${BASE_URL}/api/classify`, { method: "POST", body: form }).then(handle);
  },

  createBatch: (payload) =>
    fetch(`${BASE_URL}/api/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  getBatch: (id) => fetch(`${BASE_URL}/api/batches/${id}`).then(handle),

  getMatches: (batchId) => fetch(`${BASE_URL}/api/batches/${batchId}/matches`).then(handle),

  selectMatch: (matchId, actor = "demo-user") =>
    fetch(`${BASE_URL}/api/matches/${matchId}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor }),
    }).then(handle),

  getTimeline: (batchId) => fetch(`${BASE_URL}/api/batches/${batchId}/timeline`).then(handle),

  updateStatus: (batchId, eventType, actor = "demo-user") =>
    fetch(`${BASE_URL}/api/batches/${batchId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: eventType, actor }),
    }).then(handle),

  getDashboard: () => fetch(`${BASE_URL}/api/dashboard`).then(handle),
};
