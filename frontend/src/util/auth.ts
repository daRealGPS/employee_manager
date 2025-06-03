import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  exp?: number;
};

export function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<JwtPayload>(token);

    if (!payload.exp) return true;

    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  } catch {
    return true;
  }
}

export function getTokenOrNull(): string | null {
  const token = sessionStorage.getItem("token");
  if (!token) return null;

  if (isTokenExpired(token)) {
    sessionStorage.removeItem("token");
    return null;
  }

  return token;
}

export function clearSession() {
  sessionStorage.removeItem("token");
}