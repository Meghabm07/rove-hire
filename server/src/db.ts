import pg from "pg";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { hashPassword, isPasswordHash, verifyPassword } from "./password.js";
import { seedStore } from "./seed.js";
import type {
  Candidate,
  CandidateStatus,
  HrRole,
  HrSession,
  Interview,
  InterviewRecommendation,
  InterviewType,
  JobOpening,
  OfferDocument,
  Store,
  TimelineEvent
} from "./types.js";

const { Pool } = pg;

dotenv.config();
dotenv.config({ path: "../.env" });

function databaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";

  if (!user || !password || !database) {
    throw new Error(
      "Database config is missing. Set DATABASE_URL or POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB."
    );
  }

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

class Database {
  private static instance: Database;
  readonly pool: pg.Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: databaseUrl()
    });
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

export const db = Database.getInstance();
export const pool = db.pool;

function toJob(row: Record<string, unknown>): JobOpening {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    requiredSkills: row.required_skills as string[],
    status: row.status as JobOpening["status"],
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function toOfferDocument(row: Record<string, unknown>): OfferDocument {
  return {
    id: String(row.id),
    candidateId: String(row.candidate_id),
    type: row.type as OfferDocument["type"],
    fileName: String(row.file_name),
    path: String(row.path),
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function toInterview(row: Record<string, unknown>): Interview {
  return {
    id: String(row.id),
    candidateId: String(row.candidate_id),
    candidateName: row.candidate_name ? String(row.candidate_name) : undefined,
    roleTitle: row.role_title ? String(row.role_title) : undefined,
    scheduledAt: new Date(String(row.scheduled_at)).toISOString(),
    type: row.type as Interview["type"],
    interviewerName: String(row.interviewer_name),
    notes: (row.notes as string | null) ?? undefined,
    status: row.status as Interview["status"],
    recommendation: (row.recommendation as Interview["recommendation"] | null) ?? undefined,
    feedbackNote: (row.feedback_note as string | null) ?? undefined,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : undefined,
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function toCandidate(row: Record<string, unknown>, offerDocuments: OfferDocument[] = []): Candidate {
  return {
    id: String(row.id),
    jobId: String(row.job_id),
    name: String(row.name),
    email: String(row.email),
    status: row.status as Candidate["status"],
    lastActivityAt: new Date(String(row.last_activity_at)).toISOString(),
    resume: (row.resume as Candidate["resume"]) ?? undefined,
    magicLinkToken: (row.magic_link_token as string | null) ?? undefined,
    magicLinkExpiresAt: row.magic_link_expires_at ? new Date(String(row.magic_link_expires_at)).toISOString() : undefined,
    magicLinkUsedAt: row.magic_link_used_at ? new Date(String(row.magic_link_used_at)).toISOString() : undefined,
    profile: (row.profile as Candidate["profile"]) ?? undefined,
    offerDocuments,
    rejectionReason: (row.rejection_reason as string | null) ?? undefined,
    timeline: (row.timeline as Candidate["timeline"]) ?? []
  };
}

function timelineEvent(type: string, title: string, description?: string): TimelineEvent {
  return {
    id: `evt-${randomUUID()}`,
    type,
    title,
    description,
    createdAt: new Date().toISOString()
  };
}

async function appendTimeline(candidateId: string, event: TimelineEvent, status?: CandidateStatus) {
  await pool.query(
    `UPDATE candidates
     SET timeline = timeline || $2::jsonb,
         last_activity_at = now(),
         status = COALESCE($3::text, status)
     WHERE id = $1`,
    [candidateId, JSON.stringify([event]), status ?? null]
  );
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      name text NOT NULL,
      role text NOT NULL DEFAULT 'Recruiter' CHECK (role IN ('Admin', 'Recruiter', 'Interviewer')),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS hr_sessions (
      token text PRIMARY KEY,
      user_id text NOT NULL REFERENCES hr_users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id text PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL,
      required_skills text[] NOT NULL DEFAULT '{}',
      status text NOT NULL CHECK (status IN ('Open', 'Closed')),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id text PRIMARY KEY,
      job_id text NOT NULL REFERENCES jobs(id),
      name text NOT NULL,
      email text NOT NULL,
      status text NOT NULL CHECK (status IN ('Applied', 'Form Submitted', 'Interview Scheduled', 'Offer Sent', 'Hired', 'Rejected')),
      last_activity_at timestamptz NOT NULL DEFAULT now(),
      resume jsonb,
      magic_link_token text UNIQUE,
      magic_link_expires_at timestamptz,
      magic_link_used_at timestamptz,
      profile jsonb,
      rejection_reason text,
      timeline jsonb NOT NULL DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id text PRIMARY KEY,
      candidate_id text NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      scheduled_at timestamptz NOT NULL,
      type text NOT NULL CHECK (type IN ('Screening', 'Technical')),
      interviewer_name text NOT NULL,
      notes text,
      status text NOT NULL CHECK (status IN ('Scheduled', 'Completed')) DEFAULT 'Scheduled',
      recommendation text CHECK (recommendation IN ('Hire', 'No Hire', 'Maybe')),
      feedback_note text,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS offer_documents (
      id text PRIMARY KEY,
      candidate_id text NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      type text NOT NULL CHECK (type IN ('Offer Letter', 'NDA')),
      file_name text NOT NULL,
      path text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE hr_users
      ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Recruiter';

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'hr_users_role_check'
      ) THEN
        ALTER TABLE hr_users
          ADD CONSTRAINT hr_users_role_check CHECK (role IN ('Admin', 'Recruiter', 'Interviewer'));
      END IF;
    END $$;
  `);

  const seededPasswordHash = await hashPassword("rovehire");
  await pool.query(
    `INSERT INTO hr_users (id, email, password, name, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING`,
    ["hr-user-primary", "hr@rovedashcam.com", seededPasswordHash, "ROVE HR", "Admin"]
  );

  await upgradePlainTextSeedPassword();

  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM jobs");
  if (Number(rows[0].count) === 0) {
    await seedDb();
  }
}

async function upgradePlainTextSeedPassword() {
  const { rows } = await pool.query<{ id: string; password: string }>(
    "SELECT id, password FROM hr_users WHERE email = $1",
    ["hr@rovedashcam.com"]
  );
  const user = rows[0];
  if (!user || isPasswordHash(user.password)) return;

  await pool.query("UPDATE hr_users SET password = $2, role = 'Admin' WHERE id = $1", [
    user.id,
    await hashPassword(user.password)
  ]);
}

async function seedDb() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const job of seedStore.jobs) {
      await client.query(
        `INSERT INTO jobs (id, title, description, required_skills, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [job.id, job.title, job.description, job.requiredSkills, job.status, job.createdAt]
      );
    }
    for (const candidate of seedStore.candidates) {
      await client.query(
        `INSERT INTO candidates (
          id, job_id, name, email, status, last_activity_at, resume, magic_link_token,
          magic_link_expires_at, magic_link_used_at, profile, rejection_reason, timeline
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          candidate.id,
          candidate.jobId,
          candidate.name,
          candidate.email,
          candidate.status,
          candidate.lastActivityAt,
          candidate.resume ? JSON.stringify(candidate.resume) : null,
          candidate.magicLinkToken ?? null,
          candidate.magicLinkExpiresAt ?? null,
          candidate.magicLinkUsedAt ?? null,
          candidate.profile ? JSON.stringify(candidate.profile) : null,
          candidate.rejectionReason ?? null,
          JSON.stringify(candidate.timeline)
        ]
      );
    }
    for (const interview of seedStore.interviews) {
      await client.query(
        `INSERT INTO interviews (
          id, candidate_id, scheduled_at, type, interviewer_name, notes, status,
          recommendation, feedback_note, completed_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          interview.id,
          interview.candidateId,
          interview.scheduledAt,
          interview.type,
          interview.interviewerName,
          interview.notes ?? null,
          interview.status,
          interview.recommendation ?? null,
          interview.feedbackNote ?? null,
          interview.completedAt ?? null,
          interview.createdAt
        ]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getStore(): Promise<Store> {
  const [jobsResult, candidatesResult, interviewsResult, documentsResult] = await Promise.all([
    pool.query("SELECT * FROM jobs ORDER BY created_at DESC"),
    pool.query("SELECT * FROM candidates ORDER BY last_activity_at DESC"),
    pool.query(
      `SELECT interviews.*, candidates.name AS candidate_name, jobs.title AS role_title
       FROM interviews
       JOIN candidates ON candidates.id = interviews.candidate_id
       JOIN jobs ON jobs.id = candidates.job_id
       ORDER BY interviews.scheduled_at ASC`
    ),
    pool.query("SELECT * FROM offer_documents ORDER BY created_at DESC")
  ]);
  const documents = documentsResult.rows.map(toOfferDocument);

  return {
    jobs: jobsResult.rows.map(toJob),
    candidates: candidatesResult.rows.map((row) =>
      toCandidate(
        row,
        documents.filter((document) => document.candidateId === String(row.id))
      )
    ),
    interviews: interviewsResult.rows.map(toInterview)
  };
}

export async function insertJob(input: Omit<JobOpening, "createdAt">) {
  await pool.query(
    `INSERT INTO jobs (id, title, description, required_skills, status)
     VALUES ($1, $2, $3, $4, $5)`,
    [input.id, input.title, input.description, input.requiredSkills, input.status]
  );
}

export async function setJobStatus(id: string, status: JobOpening["status"]) {
  const result = await pool.query("UPDATE jobs SET status = $2 WHERE id = $1", [id, status]);
  return (result.rowCount ?? 0) > 0;
}

export async function insertCandidate(input: {
  jobId: string;
  name: string;
  email: string;
  resume: Candidate["resume"];
}) {
  const jobResult = await pool.query<{ title: string; status: JobOpening["status"] }>(
    "SELECT title, status FROM jobs WHERE id = $1",
    [input.jobId]
  );
  const job = jobResult.rows[0];
  if (!job || job.status === "Closed") return null;

  const id = `cand-${randomUUID()}`;
  const token = `apply_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();
  const timeline = [
    {
      id: `evt-${randomUUID()}`,
      type: "applied",
      title: "Candidate added",
      description: `Resume received for ${job.title}.`,
      createdAt
    }
  ];

  await pool.query(
    `INSERT INTO candidates (
      id, job_id, name, email, status, last_activity_at, resume, magic_link_token,
      magic_link_expires_at, timeline
    )
    VALUES ($1, $2, $3, $4, 'Applied', $5, $6::jsonb, $7, $8, $9::jsonb)`,
    [
      id,
      input.jobId,
      input.name,
      input.email,
      createdAt,
      JSON.stringify(input.resume),
      token,
      expiresAt,
      JSON.stringify(timeline)
    ]
  );

  return {
    id,
    token,
    expiresAt
  };
}

export async function getPublicApplication(token: string) {
  const { rows } = await pool.query(
    `SELECT candidates.*, jobs.title AS role_title
     FROM candidates
     JOIN jobs ON jobs.id = candidates.job_id
     WHERE candidates.magic_link_token = $1`,
    [token]
  );
  const row = rows[0];
  if (!row) return { state: "missing" as const };
  if (row.magic_link_used_at) return { state: "used" as const, candidate: toCandidate(row), roleTitle: String(row.role_title) };
  if (new Date(String(row.magic_link_expires_at)).getTime() < Date.now()) {
    return { state: "expired" as const, candidate: toCandidate(row), roleTitle: String(row.role_title) };
  }
  return { state: "active" as const, candidate: toCandidate(row), roleTitle: String(row.role_title) };
}

export async function submitPublicApplication(
  token: string,
  profile: NonNullable<Candidate["profile"]>
) {
  const application = await getPublicApplication(token);
  if (application.state !== "active") return application;

  await pool.query(
    `UPDATE candidates
     SET profile = $2::jsonb,
         magic_link_used_at = now(),
         status = 'Form Submitted',
         last_activity_at = now(),
         timeline = timeline || $3::jsonb
     WHERE magic_link_token = $1`,
    [
      token,
      JSON.stringify(profile),
      JSON.stringify([timelineEvent("form", "Application form submitted", "Candidate completed the public application form.")])
    ]
  );

  return { state: "submitted" as const };
}

export async function insertInterview(input: {
  candidateId: string;
  scheduledAt: string;
  type: InterviewType;
  interviewerName: string;
  notes?: string;
}) {
  const id = `int-${randomUUID()}`;
  await pool.query(
    `INSERT INTO interviews (id, candidate_id, scheduled_at, type, interviewer_name, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, input.candidateId, input.scheduledAt, input.type, input.interviewerName, input.notes ?? null]
  );
  await appendTimeline(
    input.candidateId,
    timelineEvent("interview", `${input.type} interview scheduled`, `With ${input.interviewerName}.`),
    "Interview Scheduled"
  );
  return id;
}

export async function completeInterview(input: {
  interviewId: string;
  recommendation: InterviewRecommendation;
  feedbackNote: string;
}) {
  const { rows } = await pool.query<{ candidate_id: string; type: string }>(
    `UPDATE interviews
     SET status = 'Completed', recommendation = $2, feedback_note = $3, completed_at = now()
     WHERE id = $1
     RETURNING candidate_id, type`,
    [input.interviewId, input.recommendation, input.feedbackNote]
  );

  const interview = rows[0];
  if (!interview) return false;

  await appendTimeline(
    interview.candidate_id,
    timelineEvent("feedback", `${interview.type} feedback recorded`, `${input.recommendation}: ${input.feedbackNote}`)
  );
  return true;
}

export async function getCandidateForOffer(candidateId: string) {
  const { rows } = await pool.query(
    `SELECT candidates.*, jobs.title AS role_title
     FROM candidates
     JOIN jobs ON jobs.id = candidates.job_id
     WHERE candidates.id = $1`,
    [candidateId]
  );
  const row = rows[0];
  if (!row) return null;
  return { candidate: toCandidate(row), roleTitle: String(row.role_title) };
}

export async function insertOfferDocuments(candidateId: string, documents: Array<Omit<OfferDocument, "id" | "candidateId" | "createdAt">>) {
  for (const document of documents) {
    await pool.query(
      `INSERT INTO offer_documents (id, candidate_id, type, file_name, path)
       VALUES ($1, $2, $3, $4, $5)`,
      [`doc-${randomUUID()}`, candidateId, document.type, document.fileName, document.path]
    );
  }
  await appendTimeline(candidateId, timelineEvent("offer", "Offer documents generated", "Offer letter and NDA are ready to download."), "Offer Sent");
}

export async function markCandidateHired(candidateId: string) {
  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM offer_documents WHERE candidate_id = $1", [candidateId]);
  if (Number(rows[0].count) === 0) return { ok: false as const, reason: "missing-offer" as const };

  await appendTimeline(candidateId, timelineEvent("hired", "Candidate marked hired"), "Hired");
  return { ok: true as const };
}

export async function markCandidateRejected(candidateId: string, reason: string) {
  await pool.query("UPDATE candidates SET rejection_reason = $2 WHERE id = $1", [candidateId, reason]);
  await appendTimeline(candidateId, timelineEvent("rejected", "Candidate rejected", reason), "Rejected");
}

export async function createSession(email: string, password: string) {
  const { rows } = await pool.query<{ id: string; email: string; name: string; password: string; role: HrRole }>(
    "SELECT id, email, name, password, role FROM hr_users WHERE lower(email) = lower($1)",
    [email.trim()]
  );

  const user = rows[0];
  if (!user) return null;
  if (!(await verifyPassword(password, user.password))) return null;

  if (!isPasswordHash(user.password)) {
    await pool.query("UPDATE hr_users SET password = $2 WHERE id = $1", [user.id, await hashPassword(password)]);
  }

  const token = `sess_${randomUUID()}`;
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await pool.query("INSERT INTO hr_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)", [
    token,
    user.id,
    expiresAt.toISOString()
  ]);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
}

export async function getSession(token: string): Promise<HrSession | null> {
  const { rows } = await pool.query<{ id: string; email: string; name: string; role: HrRole; expires_at: string }>(
    `SELECT hr_users.id, hr_users.email, hr_users.name, hr_users.role, hr_sessions.expires_at
     FROM hr_sessions
     JOIN hr_users ON hr_users.id = hr_sessions.user_id
     WHERE hr_sessions.token = $1 AND hr_sessions.expires_at > now()`,
    [token]
  );

  const session = rows[0];
  if (!session) return null;

  return {
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role
    },
    expiresAt: new Date(session.expires_at).toISOString()
  };
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM hr_sessions WHERE token = $1", [token]);
}
