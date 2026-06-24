import type { Request, Response, NextFunction } from "express";
import { createJob, updateJobStatus } from "../services/jobService.js";
import type { JobOpening } from "../types.js";

function parseJobStatus(value: unknown): JobOpening["status"] {
  return value === "Closed" ? "Closed" : "Open";
}

function parseSkillList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((skill: string) => skill.trim()).filter(Boolean);
}

export async function createJobOpening(request: Request, response: Response, next: NextFunction) {
  try {
    const title = String(request.body.title ?? "").trim();
    const description = String(request.body.description ?? "").trim();
    const requiredSkills = parseSkillList(request.body.requiredSkills);
    const status = parseJobStatus(request.body.status);

    if (!title || !description) {
      response.status(400).json({ error: "Title and description are required." });
      return;
    }

    await createJob({ title, description, requiredSkills, status });
    response.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function updateOpeningStatus(request: Request, response: Response, next: NextFunction) {
  try {
    const updated = await updateJobStatus(request.params.id, parseJobStatus(request.body.status));
    if (!updated) {
      response.status(404).json({ error: "Job not found." });
      return;
    }

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
