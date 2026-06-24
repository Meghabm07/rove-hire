import { createSession, deleteSession, getSession } from "../db.js";

export async function signInHrUser(email: string, password: string) {
  return createSession(email, password);
}

export async function findHrSession(token: string) {
  return getSession(token);
}

export async function signOutHrUser(token: string) {
  if (!token) return;
  await deleteSession(token);
}
