"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { signIn, signOut } from "@/lib/auth";
import {
  addCandidate,
  completeInterview,
  createJob,
  generateOffer,
  markHired,
  markRejected,
  scheduleInterview,
  submitApplication,
  updateJobStatus
} from "@/lib/data";

type SignInState = {
  error: string | null;
};

export async function signInAction(_previousState: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!(await signIn(email, password))) {
    return { error: "The email or password does not match the HR account." };
  }

  redirect("/");
}

export async function signOutAction() {
  await signOut();
  redirect("/signin");
}

export async function createJobAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const requiredSkills = String(formData.get("requiredSkills") ?? "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const status = String(formData.get("status") ?? "Open") === "Closed" ? "Closed" : "Open";

  if (!title || !description) {
    redirect("/jobs/new?error=missing");
  }

  await createJob({
    title,
    description,
    requiredSkills,
    status
  });
  redirect("/jobs");
}

export async function updateJobStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "Open") === "Closed" ? "Closed" : "Open";
  await updateJobStatus(id, status);
  redirect("/jobs");
}

function appBaseUrl() {
  const headerList = headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return process.env.NEXT_PUBLIC_APP_URL ?? `${protocol}://${host}`;
}

export async function addCandidateAction(formData: FormData) {
  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    redirect("/candidates/new?error=resume");
  }

  if (resume.size > 10 * 1024 * 1024 || resume.type !== "application/pdf") {
    redirect("/candidates/new?error=resume");
  }

  const buffer = Buffer.from(await resume.arrayBuffer());
  const result = await addCandidate({
    jobId: String(formData.get("jobId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    appBaseUrl: appBaseUrl(),
    resume: {
      fileName: resume.name,
      size: resume.size,
      base64: buffer.toString("base64")
    }
  });

  redirect(`/candidates/new?magicLink=${encodeURIComponent(result.magicLink)}`);
}

export async function submitApplicationAction(token: string, formData: FormData) {
  await submitApplication(token, {
    phone: String(formData.get("phone") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    currentRole: String(formData.get("currentRole") ?? "").trim(),
    noticePeriod: String(formData.get("noticePeriod") ?? "").trim(),
    salaryExpectation: String(formData.get("salaryExpectation") ?? "").trim(),
    linkedinUrl: String(formData.get("linkedinUrl") ?? "").trim()
  });

  redirect(`/apply/${token}?submitted=1`);
}

export async function scheduleInterviewAction(candidateId: string, formData: FormData) {
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  await scheduleInterview({
    candidateId,
    scheduledAt: new Date(`${date}T${time}`).toISOString(),
    type: String(formData.get("type") ?? "Screening") === "Technical" ? "Technical" : "Screening",
    interviewerName: String(formData.get("interviewerName") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim()
  });

  redirect(`/candidates/${candidateId}`);
}

export async function completeInterviewAction(candidateId: string, formData: FormData) {
  const recommendation = String(formData.get("recommendation") ?? "Hire");
  await completeInterview({
    interviewId: String(formData.get("interviewId") ?? ""),
    recommendation: recommendation === "No Hire" || recommendation === "Maybe" ? recommendation : "Hire",
    feedbackNote: String(formData.get("feedbackNote") ?? "").trim()
  });

  redirect(`/candidates/${candidateId}`);
}

export async function generateOfferAction(candidateId: string, formData: FormData) {
  await generateOffer({
    candidateId,
    roleTitle: String(formData.get("roleTitle") ?? "").trim(),
    currency: String(formData.get("currency") ?? "USD").trim(),
    amount: String(formData.get("amount") ?? "").trim(),
    startDate: String(formData.get("startDate") ?? "").trim(),
    reportingManager: String(formData.get("reportingManager") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim()
  });

  redirect(`/candidates/${candidateId}`);
}

export async function markHiredAction(candidateId: string) {
  await markHired(candidateId);
  redirect(`/candidates/${candidateId}`);
}

export async function markRejectedAction(candidateId: string, formData: FormData) {
  await markRejected(candidateId, String(formData.get("reason") ?? "").trim());
  redirect(`/candidates/${candidateId}`);
}
