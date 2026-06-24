import {
  getCandidateForOffer,
  getPublicApplication,
  insertCandidate,
  insertOfferDocuments,
  markCandidateHired,
  markCandidateRejected,
  submitPublicApplication
} from "../db.js";
import { createSimplePdf, saveBase64File, savePdf } from "../storage.js";
import type { Candidate } from "../types.js";

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
  const savedResume = await saveBase64File(input.name, input.resume.fileName, input.resume.base64);
  const candidate = await insertCandidate({
    jobId: input.jobId,
    name: input.name,
    email: input.email,
    resume: {
      fileName: savedResume.fileName,
      path: savedResume.path,
      size: input.resume.size
    }
  });

  if (!candidate) return null;

  return {
    ...candidate,
    magicLink: `${input.appBaseUrl.replace(/\/$/, "")}/apply/${candidate.token}`
  };
}

export async function readPublicApplication(token: string) {
  return getPublicApplication(token);
}

export async function submitApplicationForm(token: string, profile: NonNullable<Candidate["profile"]>) {
  return submitPublicApplication(token, profile);
}

export async function generateOfferDocuments(input: {
  candidateId: string;
  roleTitle: string;
  currency: string;
  amount: string;
  startDate: string;
  reportingManager: string;
  location: string;
}) {
  const record = await getCandidateForOffer(input.candidateId);
  if (!record) return null;

  const candidate = record.candidate;
  const salary = `${input.currency} ${input.amount}`;
  const today = new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
  const safeCandidate = candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const offerPdf = createSimplePdf("ROVE Offer Letter", [
    `Date: ${today}`,
    "",
    `Dear ${candidate.name},`,
    "",
    `We are pleased to offer you the role of ${input.roleTitle} at ROVE.`,
    `Your annual compensation will be ${salary}.`,
    `Your anticipated start date is ${input.startDate}.`,
    `You will report to ${input.reportingManager} and be based in ${input.location}.`,
    "",
    "This offer reflects our confidence in your ability to help us build thoughtful, high-quality products.",
    "Please acknowledge acceptance by signing below.",
    "",
    "For ROVE",
    "____________________________",
    "Authorized Signatory",
    "",
    "Accepted by Candidate",
    "____________________________"
  ]);

  const ndaPdf = createSimplePdf("ROVE Confidentiality Agreement", [
    `Date: ${today}`,
    "",
    `Candidate: ${candidate.name}`,
    "",
    "By joining ROVE, you agree to protect confidential information shared with you during your employment.",
    "Confidential information includes product plans, customer data, business operations, technical designs,",
    "financial details, hiring information, and any non-public material disclosed by ROVE or its partners.",
    "",
    "You agree not to disclose or misuse confidential information during or after your relationship with ROVE.",
    "This template is provided for hiring workflow demonstration purposes.",
    "",
    "Candidate Signature",
    "____________________________"
  ]);

  const offerFile = await savePdf(safeCandidate, "offer-letter.pdf", offerPdf);
  const ndaFile = await savePdf(safeCandidate, "nda.pdf", ndaPdf);

  await insertOfferDocuments(input.candidateId, [
    { type: "Offer Letter", fileName: offerFile.fileName, path: offerFile.path },
    { type: "NDA", fileName: ndaFile.fileName, path: ndaFile.path }
  ]);

  return { ok: true };
}

export async function hireCandidate(candidateId: string) {
  return markCandidateHired(candidateId);
}

export async function rejectCandidate(candidateId: string, reason: string) {
  await markCandidateRejected(candidateId, reason);
}
