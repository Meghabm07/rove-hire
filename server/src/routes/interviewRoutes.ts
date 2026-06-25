import { Router } from "express";
import { completeInterviewFeedback } from "../controllers/interviewController.js";
import { requireRoles } from "../middleware/authMiddleware.js";

export const interviewRouter = Router();

interviewRouter.patch("/:id/complete", requireRoles("Admin", "Recruiter", "Interviewer"), completeInterviewFeedback);
