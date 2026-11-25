const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export function resolveAssetUrl(url?: string | null, fallback?: string): string {
  const value = url?.trim() || fallback?.trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const path = value.startsWith("/") ? value : `/${value}`;
  if (path === "/uploads" || path.startsWith("/uploads/")) {
    return `${API_BASE_URL}${path}`;
  }
  if (path === "/test_logo2.png" || path === "/assets/test_logo2.png") {
    return "/assets/valenzuela-logo.png";
  }
  if (path === "/assets" || path.startsWith("/assets/")) return path;

  return `/assets${path}`;
}
