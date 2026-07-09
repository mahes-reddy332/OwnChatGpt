const RAW_BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://127.0.0.1:8000";

export function getBackendBaseUrl() {
  return RAW_BACKEND_URL.replace(/\/$/, "");
}

export function getBackendApiUrl(path: string) {
  return `${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
