import { Router } from "express";
import {
  createCandidate,
  createOfferDocuments,
  markHired,
  markRejected,
  readApplication,
  submitApplication
} from "../controllers/candidateController.js";
import { createInterview } from "../controllers/interviewController.js";
import { requireRoles } from "../middleware/authMiddleware.js";

export const candidateRouter = Router();

candidateRouter.post("/", requireRoles("Admin", "Recruiter"), createCandidate);
candidateRouter.get("/applications/:token", readApplication);
candidateRouter.post("/applications/:token", submitApplication);
candidateRouter.post("/:id/interviews", requireRoles("Admin", "Recruiter"), createInterview);
candidateRouter.post("/:id/offers", requireRoles("Admin", "Recruiter"), createOfferDocuments);
candidateRouter.patch("/:id/hired", requireRoles("Admin", "Recruiter"), markHired);
candidateRouter.patch("/:id/rejected", requireRoles("Admin", "Recruiter"), markRejected);
