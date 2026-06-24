import type { Request, Response, NextFunction } from "express";
import { recordInterviewFeedback, scheduleInterview } from "../services/interviewService.js";
import type { InterviewRecommendation, InterviewType } from "../types.js";

function parseInterviewType(value: unknown): InterviewType {
  return value === "Technical" ? "Technical" : "Screening";
}

function parseRecommendation(value: unknown): InterviewRecommendation {
  if (value === "No Hire") return "No Hire";
  if (value === "Maybe") return "Maybe";
  return "Hire";
}

export async function createInterview(request: Request, response: Response, next: NextFunction) {
  try {
    const scheduledAt = String(request.body.scheduledAt ?? "").trim();
    const interviewerName = String(request.body.interviewerName ?? "").trim();

    if (!scheduledAt || !interviewerName) {
      response.status(400).json({ error: "Interview date/time and interviewer are required." });
      return;
    }

    const id = await scheduleInterview({
      candidateId: request.params.id,
      scheduledAt,
      type: parseInterviewType(request.body.type),
      interviewerName,
      notes: String(request.body.notes ?? "").trim() || undefined
    });
    response.status(201).json({ id });
  } catch (error) {
    next(error);
  }
}

export async function completeInterviewFeedback(request: Request, response: Response, next: NextFunction) {
  try {
    const feedbackNote = String(request.body.feedbackNote ?? "").trim();
    if (!feedbackNote) {
      response.status(400).json({ error: "Feedback note is required." });
      return;
    }

    const ok = await recordInterviewFeedback({
      interviewId: request.params.id,
      recommendation: parseRecommendation(request.body.recommendation),
      feedbackNote
    });

    if (!ok) {
      response.status(404).json({ error: "Interview not found." });
      return;
    }

    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
