import { Candidate, CandidateStatus, JobOpening, Store, TimelineEvent } from "./types";

const apiBaseUrl = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api";

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
