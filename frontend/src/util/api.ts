import { useAuthFetch } from "./fetchWithAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export function apiPath(path: string) {
  return `${API_BASE_URL}${path}`;
}

export default function useApi() {
  const fetchWithAuth = useAuthFetch();

  async function get(path: string, options: RequestInit = {}) {
    return fetchWithAuth(apiPath(path), { ...options, method: "GET" });
  }

  async function post(path: string, body: unknown, options: RequestInit = {}) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    return fetchWithAuth(apiPath(path), {
      ...options,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  async function put(path: string, body: unknown, options: RequestInit = {}) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    return fetchWithAuth(apiPath(path), {
      ...options,
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
  }

  async function del(path: string, options: RequestInit = {}) {
    return fetchWithAuth(apiPath(path), { ...options, method: "DELETE" });
  }

  return { get, post, put, del };
}