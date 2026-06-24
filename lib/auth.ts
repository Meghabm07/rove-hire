import { cookies } from "next/headers";

const SESSION_COOKIE = "rove_hire_session";
const HR_EMAIL = "hr@rovedashcam.com";
const HR_PASSWORD = "rovehire";

export function isSignedIn() {
  return cookies().get(SESSION_COOKIE)?.value === "signed-in";
}

export function assertSignedIn() {
  if (!isSignedIn()) {
    return false;
  }
  return true;
}

export function signIn(email: string, password: string) {
  if (email.trim().toLowerCase() !== HR_EMAIL || password !== HR_PASSWORD) {
    return false;
  }

  cookies().set(SESSION_COOKIE, "signed-in", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return true;
}

export function signOut() {
  cookies().delete(SESSION_COOKIE);
}
