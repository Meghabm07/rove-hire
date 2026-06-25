import type { NextFunction, Request, Response } from "express";
import { getSession } from "../db.js";
import type { HrRole, HrSession } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      hrSession?: HrSession;
    }
  }
}

function bearerToken(request: Request) {
  const authorization = request.headers.authorization ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
}

export async function requireSession(request: Request, response: Response, next: NextFunction) {
  try {
    const token = bearerToken(request);
    if (!token) {
      response.status(401).json({ error: "Missing session token." });
      return;
    }

    const session = await getSession(token);
    if (!session) {
      response.status(401).json({ error: "Session expired or not found." });
      return;
    }

    request.hrSession = session;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...roles: HrRole[]) {
  return [requireSession, (request: Request, response: Response, next: NextFunction) => {
    const role = request.hrSession?.user.role;
    if (!role || !roles.includes(role)) {
      response.status(403).json({ error: "You do not have permission to perform this action." });
      return;
    }

    next();
  }];
}
