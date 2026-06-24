import { Candidate, CandidateStatus, JobOpening, Store, TimelineEvent } from "./types";

const apiBaseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api";
const publicServerUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? apiBaseUrl.replace(/\/api$/, "");

function nowIso() {
  return new Date().toISOString();
}

export async function readStore(): Promise<Store> {
  const response = await fetch(`${apiBaseUrl}/store`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Backend store request failed with ${response.status}`);
  }
  return response.json() as Promise<Store>;
}

export async function createJob(input: {
  title: string;
  description: string;
  requiredSkills: string[];
  status: "Open" | "Closed";
}) {
  const response = await fetch(`${apiBaseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`Create job request failed with ${response.status}`);
  }
}

export async function updateJobStatus(id: string, status: "Open" | "Closed") {
  const response = await fetch(`${apiBaseUrl}/jobs/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    throw new Error(`Update job status request failed with ${response.status}`);
  }
}

export async function addCandidate(input: {
  jobId: string;
  name: string;
  email: string;
  resume: {
    fileName: string;
    size: number;
    base64: string;
  };
  appBaseUrl: string;
}) {
  const response = await fetch(`${apiBaseUrl}/candidates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) {
    throw new Error(`Add candidate request failed with ${response.status}`);
  }
  return response.json() as Promise<{ id: string; token: string; expiresAt: string; magicLink: string }>;
}

export async function readApplication(token: string) {
  const response = await fetch(`${apiBaseUrl}/candidates/applications/${token}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Application request failed with ${response.status}`);
  }
  return response.json() as Promise<
    | { state: "missing" }
    | { state: "used"; candidate: import("./types").Candidate; roleTitle: string }
    | { state: "expired"; candidate: import("./types").Candidate; roleTitle: string }
    | { state: "active"; candidate: import("./types").Candidate; roleTitle: string }
  >;
}

export async function submitApplication(token: string, profile: NonNullable<import("./types").Candidate["profile"]>) {
  const response = await fetch(`${apiBaseUrl}/candidates/applications/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile)
  });
  if (!response.ok) {
    throw new Error(`Submit application request failed with ${response.status}`);
  }
}

export async function scheduleInterview(input: {
  candidateId: string;
  scheduledAt: string;
  type: "Screening" | "Technical";
  interviewerName: string;
  notes?: string;
}) {
  const response = await fetch(`${apiBaseUrl}/candidates/${input.candidateId}/interviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(`Schedule interview request failed with ${response.status}`);
}

export async function completeInterview(input: {
  interviewId: string;
  recommendation: "Hire" | "No Hire" | "Maybe";
  feedbackNote: string;
}) {
  const response = await fetch(`${apiBaseUrl}/interviews/${input.interviewId}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(`Complete interview request failed with ${response.status}`);
}

export async function generateOffer(input: {
  candidateId: string;
  roleTitle: string;
  currency: string;
  amount: string;
  startDate: string;
  reportingManager: string;
  location: string;
}) {
  const response = await fetch(`${apiBaseUrl}/candidates/${input.candidateId}/offers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error(`Generate offer request failed with ${response.status}`);
}

export async function markHired(candidateId: string) {
  const response = await fetch(`${apiBaseUrl}/candidates/${candidateId}/hired`, { method: "PATCH" });
  if (!response.ok) throw new Error(`Mark hired request failed with ${response.status}`);
}

export async function markRejected(candidateId: string, reason: string) {
  const response = await fetch(`${apiBaseUrl}/candidates/${candidateId}/rejected`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  if (!response.ok) throw new Error(`Mark rejected request failed with ${response.status}`);
}

export function fileUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${publicServerUrl}${path}`;
}

export function statusClass(status: CandidateStatus) {
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}

export function findJob(jobs: JobOpening[], jobId: string) {
  return jobs.find((job) => job.id === jobId);
}

export function touchCandidate(candidate: Candidate, status?: CandidateStatus) {
  const timestamp = nowIso();
  candidate.lastActivityAt = timestamp;
  if (status) candidate.status = status;
  return timestamp;
}

export function createTimelineEvent(type: string, title: string, description?: string): TimelineEvent {
  return {
    id: `evt-${crypto.randomUUID()}`,
    type,
    title,
    description,
    createdAt: nowIso()
  };
}
