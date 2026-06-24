import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { isSignedIn } from "@/lib/auth";
import { findJob, readStore } from "@/lib/data";
import { CandidateStatus } from "@/lib/types";

const statuses: Array<CandidateStatus | "All"> = [
  "All",
  "Applied",
  "Form Submitted",
  "Interview Scheduled",
  "Offer Sent",
  "Hired",
  "Rejected"
];

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string };
}) {
  if (!(await isSignedIn())) redirect("/signin");

  const store = await readStore();
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const status = (searchParams?.status ?? "All") as CandidateStatus | "All";
  const candidates = store.candidates
    .filter((candidate) => {
      const job = findJob(store.jobs, candidate.jobId);
      const text = `${candidate.name} ${job?.title ?? ""}`.toLowerCase();
      return (!query || text.includes(query)) && (status === "All" || candidate.status === status);
    })
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Candidate Pipeline</h1>
          <p className="muted">Track every candidate from resume intake through application submission.</p>
        </div>
        <Link className="button primary" href="/candidates/new">
          <Plus size={18} /> Add Candidate
        </Link>
      </div>

      <form className="toolbar">
        <input className="input" name="q" placeholder="Search name or role" defaultValue={searchParams?.q ?? ""} />
        <select className="select" name="status" defaultValue={status}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </form>

      {candidates.length ? (
        <section className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const job = findJob(store.jobs, candidate.jobId);
                return (
                  <tr key={candidate.id}>
                    <td>
                      <Link href={`/candidates/${candidate.id}`}>
                        <strong>{candidate.name}</strong>
                        <br />
                        <span className="muted">{candidate.email}</span>
                      </Link>
                    </td>
                    <td>{job?.title ?? "Unknown role"}</td>
                    <td>
                      <StatusPill status={candidate.status} />
                    </td>
                    <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(candidate.lastActivityAt))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="empty-state">
          <h2>No candidates found</h2>
          <p className="muted">Adjust the search or filter to see more of the pipeline.</p>
        </section>
      )}
    </AppShell>
  );
}
