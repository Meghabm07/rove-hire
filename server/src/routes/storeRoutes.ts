import { Router } from "express";
import { readStore } from "../controllers/storeController.js";
import { requireRoles } from "../middleware/authMiddleware.js";

export const storeRouter = Router();

storeRouter.get("/", requireRoles("Admin", "Recruiter", "Interviewer"), readStore);
