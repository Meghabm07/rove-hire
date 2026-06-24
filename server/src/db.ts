import pg from "pg";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { seedStore } from "./seed.js";
import type { Candidate, JobOpening, Store } from "./types.js";

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

function toCandidate(row: Record<string, unknown>): Candidate {
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
    rejectionReason: (row.rejection_reason as string | null) ?? undefined,
    timeline: (row.timeline as Candidate["timeline"]) ?? []
  };
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hr_users (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      password text NOT NULL,
      name text NOT NULL,
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
  `);

  await pool.query(
    `INSERT INTO hr_users (id, email, password, name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING`,
    ["hr-user-primary", "hr@rovedashcam.com", "rovehire", "ROVE HR"]
  );

  const { rows } = await pool.query<{ count: string }>("SELECT COUNT(*) FROM jobs");
  if (Number(rows[0].count) === 0) {
    await seedDb();
  }
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
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getStore(): Promise<Store> {
  const [jobsResult, candidatesResult] = await Promise.all([
    pool.query("SELECT * FROM jobs ORDER BY created_at DESC"),
    pool.query("SELECT * FROM candidates ORDER BY last_activity_at DESC")
  ]);

  return {
    jobs: jobsResult.rows.map(toJob),
    candidates: candidatesResult.rows.map(toCandidate)
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

export async function createSession(email: string, password: string) {
  const { rows } = await pool.query<{ id: string; email: string; name: string }>(
    "SELECT id, email, name FROM hr_users WHERE lower(email) = lower($1) AND password = $2",
    [email.trim(), password]
  );

  const user = rows[0];
  if (!user) return null;

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
      name: user.name
    }
  };
}

export async function getSession(token: string) {
  const { rows } = await pool.query<{ id: string; email: string; name: string; expires_at: string }>(
    `SELECT hr_users.id, hr_users.email, hr_users.name, hr_sessions.expires_at
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
      name: session.name
    },
    expiresAt: new Date(session.expires_at).toISOString()
  };
}

export async function deleteSession(token: string) {
  await pool.query("DELETE FROM hr_sessions WHERE token = $1", [token]);
}
