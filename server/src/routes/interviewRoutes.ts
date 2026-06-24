import { Router } from "express";
import { completeInterviewFeedback } from "../controllers/interviewController.js";

export const interviewRouter = Router();

interviewRouter.patch("/:id/complete", completeInterviewFeedback);
