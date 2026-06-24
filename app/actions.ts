"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { createTimelineEvent, readStore, touchCandidate, writeStore } from "@/lib/data";

export async function signInAction(_previousState: { error?: string }, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!signIn(email, password)) {
    return { error: "The email or password does not match the HR account." };
  }

  redirect("/");
}

export async function signOutAction() {
  signOut();
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

  const store = await readStore();
  store.jobs.unshift({
    id: `job-${crypto.randomUUID()}`,
    title,
    description,
    requiredSkills,
    status,
    createdAt: new Date().toISOString()
  });
  await writeStore(store);
  redirect("/jobs");
}

export async function updateJobStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "Open") === "Closed" ? "Closed" : "Open";
  const store = await readStore();
  const job = store.jobs.find((item) => item.id === id);
  if (job) {
    job.status = status;
    await writeStore(store);
  }
  redirect("/jobs");
}
