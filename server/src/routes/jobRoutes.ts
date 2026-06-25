import { Router } from "express";
import { createJobOpening, updateOpeningStatus } from "../controllers/jobController.js";
import { requireRoles } from "../middleware/authMiddleware.js";

export const jobRouter = Router();

jobRouter.post("/", requireRoles("Admin", "Recruiter"), createJobOpening);
jobRouter.patch("/:id/status", requireRoles("Admin", "Recruiter"), updateOpeningStatus);
