import axios from "axios";

export const API_BASE = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || "/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

export function absoluteApiUrl(path = "") {
  const url = String(path || "").trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("data:")) return url;
  const base = API_BASE.replace(/\/$/, "");
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}

export default api;
