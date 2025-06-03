// src/util/fetchWithAuth.ts
import { useNavigate } from "react-router-dom";
import { clearSession, getTokenOrNull } from "./auth";

export function useAuthFetch() {
  const navigate = useNavigate();

  return async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = getTokenOrNull();

    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return null;
    }

    const headers: HeadersInit = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      clearSession();
      navigate("/login", { replace: true });
      return null;
    }

    return res;
  };
}