import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { isSignedIn } from "@/lib/auth";
import { createJobAction } from "@/app/actions";

export default function NewJobPage({ searchParams }: { searchParams?: { error?: string } }) {
  if (!isSignedIn()) redirect("/signin");

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <Link className="muted" href="/jobs">
            <ArrowLeft size={16} /> Back to jobs
          </Link>
          <h1>Create Job Opening</h1>
          <p className="muted">Define the role HR can attach new candidates to.</p>
        </div>
      </div>

      <section className="panel" style={{ padding: 24, maxWidth: 760 }}>
        <form action={createJobAction}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input className="input" id="title" name="title" required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea className="textarea" id="description" name="description" required />
          </div>
          <div className="field">
            <label htmlFor="requiredSkills">Required skills</label>
            <input className="input" id="requiredSkills" name="requiredSkills" placeholder="Next.js, TypeScript, APIs" />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select className="select" id="status" name="status" defaultValue="Open">
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          {searchParams?.error ? <p className="error">Title and description are required.</p> : null}
          <button className="button primary" type="submit">
            Create opening
          </button>
        </form>
      </section>
    </AppShell>
  );
}
