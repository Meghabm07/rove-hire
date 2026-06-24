import type { Request, Response, NextFunction } from "express";
import { getRecruitingStore } from "../services/storeService.js";

export async function readStore(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await getRecruitingStore());
  } catch (error) {
    next(error);
  }
}
