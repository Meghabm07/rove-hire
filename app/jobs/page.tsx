import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { isSignedIn } from "@/lib/auth";
import { readStore } from "@/lib/data";
import { updateJobStatusAction } from "../actions";

export default async function JobsPage() {
  if (!isSignedIn()) redirect("/signin");

  const store = await readStore();

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Job Openings</h1>
          <p className="muted">Create roles and keep closed openings visible for historical context.</p>
        </div>
        <Link className="button primary" href="/jobs/new">
          <Plus size={18} /> New Opening
        </Link>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Opening</th>
              <th>Skills</th>
              <th>Candidates</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {store.jobs.map((job) => {
              const count = store.candidates.filter((candidate) => candidate.jobId === job.id).length;
              return (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <br />
                    <span className="muted">{job.description}</span>
                  </td>
                  <td>{job.requiredSkills.join(", ") || "No skills listed"}</td>
                  <td>{count}</td>
                  <td>
                    <span className={`status-pill ${job.status === "Open" ? "status-hired" : "status-rejected"}`}>{job.status}</span>
                  </td>
                  <td>
                    <form action={updateJobStatusAction} style={{ display: "flex", gap: 8 }}>
                      <input type="hidden" name="id" value={job.id} />
                      <select className="select" name="status" defaultValue={job.status} aria-label={`Status for ${job.title}`}>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <button className="button secondary" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
