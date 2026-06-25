import { cookies } from "next/headers";

const SESSION_COOKIE = "rove_hire_session";
const apiBaseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api";

export async function isSignedIn() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const response = await fetch(`${apiBaseUrl}/auth/session`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  return response.ok;
}

export async function assertSignedIn() {
  if (!(await isSignedIn())) {
    return false;
  }
  return true;
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${apiBaseUrl}/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });

  if (!response.ok) {
    return false;
  }

  const session = (await response.json()) as { token: string; expiresAt: string };
  cookies().set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(session.expiresAt),
    maxAge: 60 * 60 * 8
  });
  return true;
}

export async function signOut() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await fetch(`${apiBaseUrl}/auth/sign-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  }
  cookies().delete(SESSION_COOKIE);
}
