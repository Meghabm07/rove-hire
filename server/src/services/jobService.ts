import { randomUUID } from "crypto";
import { insertJob, setJobStatus } from "../db.js";
import type { JobOpening } from "../types.js";

export type CreateJobInput = {
  title: string;
  description: string;
  requiredSkills: string[];
  status: JobOpening["status"];
};

export async function createJob(input: CreateJobInput) {
  await insertJob({
    id: `job-${randomUUID()}`,
    title: input.title,
    description: input.description,
    requiredSkills: input.requiredSkills,
    status: input.status
  });
}

export async function updateJobStatus(id: string, status: JobOpening["status"]) {
  return setJobStatus(id, status);
}
