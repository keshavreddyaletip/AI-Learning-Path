const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API}. Start FastAPI locally or check VITE_API_URL.`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

export const getRoadmap = (profile) => post("/roadmap", profile);
export const getVideo = (topic, profile) => post("/youtube", { topic, profile });
export const getQuiz = (topic, profile) => post("/quiz", { topic, profile, count: 5 });
export const getHealth = async () => {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error("Backend health check failed");
  return res.json();
};
