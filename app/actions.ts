"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { createJob, updateJobStatus } from "@/lib/data";

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
