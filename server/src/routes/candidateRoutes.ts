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

export const candidateRouter = Router();

candidateRouter.post("/", createCandidate);
candidateRouter.get("/applications/:token", readApplication);
candidateRouter.post("/applications/:token", submitApplication);
candidateRouter.post("/:id/interviews", createInterview);
candidateRouter.post("/:id/offers", createOfferDocuments);
candidateRouter.patch("/:id/hired", markHired);
candidateRouter.patch("/:id/rejected", markRejected);
