import { completeInterview, insertInterview } from "../db.js";
import type { InterviewRecommendation, InterviewType } from "../types.js";

export async function scheduleInterview(input: {
  candidateId: string;
  scheduledAt: string;
  type: InterviewType;
  interviewerName: string;
  notes?: string;
}) {
  return insertInterview(input);
}

export async function recordInterviewFeedback(input: {
  interviewId: string;
  recommendation: InterviewRecommendation;
  feedbackNote: string;
}) {
  return completeInterview(input);
}
