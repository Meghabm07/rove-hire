import type { Request, Response, NextFunction } from "express";
import { findHrSession, signInHrUser, signOutHrUser } from "../services/authService.js";

function bearerToken(request: Request) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
}

export async function signIn(request: Request, response: Response, next: NextFunction) {
  try {
    const email = String(request.body.email ?? "");
    const password = String(request.body.password ?? "");
    const session = await signInHrUser(email, password);

    if (!session) {
      response.status(401).json({ error: "Invalid credentials." });
      return;
    }

    response.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

export async function readSession(request: Request, response: Response, next: NextFunction) {
  try {
    const token = bearerToken(request);
    if (!token) {
      response.status(401).json({ error: "Missing session token." });
      return;
    }

    const session = await findHrSession(token);
    if (!session) {
      response.status(401).json({ error: "Session expired or not found." });
      return;
    }

    response.json(session);
  } catch (error) {
    next(error);
  }
}

export async function signOut(request: Request, response: Response, next: NextFunction) {
  try {
    await signOutHrUser(bearerToken(request));
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
