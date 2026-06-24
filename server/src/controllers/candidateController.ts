import type { Request, Response, NextFunction } from "express";
import {
  addCandidate,
  generateOfferDocuments,
  hireCandidate,
  readPublicApplication,
  rejectCandidate,
  submitApplicationForm
} from "../services/candidateService.js";

export async function createCandidate(request: Request, response: Response, next: NextFunction) {
  try {
    const name = String(request.body.name ?? "").trim();
    const email = String(request.body.email ?? "").trim();
    const jobId = String(request.body.jobId ?? "");
    const appBaseUrl = String(request.body.appBaseUrl ?? "http://localhost:3000");
    const resume = request.body.resume as { fileName?: string; size?: number; base64?: string } | undefined;

    if (!name || !email || !jobId || !resume?.fileName || !resume.base64 || !resume.size) {
      response.status(400).json({ error: "Candidate name, email, job, and resume are required." });
      return;
    }

    if (resume.size > 10 * 1024 * 1024) {
      response.status(400).json({ error: "Resume must be 10 MB or smaller." });
      return;
    }

    const result = await addCandidate({
      name,
      email,
      jobId,
      appBaseUrl,
      resume: {
        fileName: resume.fileName,
        size: resume.size,
        base64: resume.base64
      }
    });

    if (!result) {
      response.status(400).json({ error: "The selected job is closed or does not exist." });
      return;
    }

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function readApplication(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await readPublicApplication(request.params.token));
  } catch (error) {
    next(error);
  }
}

export async function submitApplication(request: Request, response: Response, next: NextFunction) {
  try {
    const profile = {
      phone: String(request.body.phone ?? "").trim(),
      location: String(request.body.location ?? "").trim(),
      currentRole: String(request.body.currentRole ?? "").trim(),
      noticePeriod: String(request.body.noticePeriod ?? "").trim(),
      salaryExpectation: String(request.body.salaryExpectation ?? "").trim(),
      linkedinUrl: String(request.body.linkedinUrl ?? "").trim()
    };

    if (!profile.phone || !profile.location || !profile.currentRole) {
      response.status(400).json({ error: "Phone, location, and current role are required." });
      return;
    }

    response.json(await submitApplicationForm(request.params.token, profile));
  } catch (error) {
    next(error);
  }
}

export async function createOfferDocuments(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await generateOfferDocuments({
      candidateId: request.params.id,
      roleTitle: String(request.body.roleTitle ?? "").trim(),
      currency: String(request.body.currency ?? "USD").trim(),
      amount: String(request.body.amount ?? "").trim(),
      startDate: String(request.body.startDate ?? "").trim(),
      reportingManager: String(request.body.reportingManager ?? "").trim(),
      location: String(request.body.location ?? "").trim()
    });

    if (!result) {
      response.status(404).json({ error: "Candidate not found." });
      return;
    }

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function markHired(request: Request, response: Response, next: NextFunction) {
  try {
    const result = await hireCandidate(request.params.id);
    if (!result.ok) {
      response.status(400).json({ error: "An offer must be generated before hiring." });
      return;
    }
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function markRejected(request: Request, response: Response, next: NextFunction) {
  try {
    const reason = String(request.body.reason ?? "").trim();
    if (!reason) {
      response.status(400).json({ error: "A rejection reason is required." });
      return;
    }

    await rejectCandidate(request.params.id, reason);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
