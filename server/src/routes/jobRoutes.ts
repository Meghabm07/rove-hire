import { Router } from "express";
import { createJobOpening, updateOpeningStatus } from "../controllers/jobController.js";

export const jobRouter = Router();

jobRouter.post("/", createJobOpening);
jobRouter.patch("/:id/status", updateOpeningStatus);
