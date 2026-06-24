import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { addCandidateAction } from "@/app/actions";
import { isSignedIn } from "@/lib/auth";
import { readStore } from "@/lib/data";

export default async function NewCandidatePage({
  searchParams
}: {
  searchParams?: { error?: string; magicLink?: string };
}) {
  if (!(await isSignedIn())) redirect("/signin");

  const store = await readStore();
  const openJobs = store.jobs.filter((job) => job.status === "Open");

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <Link className="muted" href="/">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <h1>Add Candidate</h1>
          <p className="muted">Upload a resume, attach an open role, and create a candidate magic link.</p>
        </div>
      </div>

      {searchParams?.magicLink ? (
        <section className="panel" style={{ padding: 24, marginBottom: 20 }}>
          <h2>Magic Link Ready</h2>
          <p className="muted">Share this one-time link with the candidate. It expires in 14 days.</p>
          <input className="input" readOnly value={searchParams.magicLink} />
        </section>
      ) : null}

      <section className="panel" style={{ padding: 24, maxWidth: 760 }}>
        <form action={addCandidateAction}>
          <div className="field">
            <label htmlFor="name">Candidate name</label>
            <input className="input" id="name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Candidate email</label>
            <input className="input" id="email" name="email" type="email" required />
          </div>
          <div className="field">
            <label htmlFor="jobId">Job opening</label>
            <select className="select" id="jobId" name="jobId" required>
              {openJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="resume">Resume PDF</label>
            <input className="input" id="resume" name="resume" type="file" accept="application/pdf" required />
          </div>
          {searchParams?.error ? <p className="error">Please upload a PDF resume under 10 MB.</p> : null}
          <button className="button primary" type="submit" disabled={!openJobs.length}>
            Create candidate
          </button>
        </form>
      </section>
    </AppShell>
  );
}
