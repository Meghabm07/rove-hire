import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { isSignedIn } from "@/lib/auth";
import { findJob, readStore } from "@/lib/data";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  if (!isSignedIn()) redirect("/signin");

  const store = await readStore();
  const candidate = store.candidates.find((item) => item.id === params.id);
  if (!candidate) notFound();
  const job = findJob(store.jobs, candidate.jobId);

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <Link className="muted" href="/">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <h1>{candidate.name}</h1>
          <p className="muted">{job?.title ?? "Unknown role"}</p>
        </div>
        <StatusPill status={candidate.status} />
      </div>

      <div className="grid-two">
        <section className="panel" style={{ padding: 24 }}>
          <h2>Profile</h2>
          <dl className="detail-list">
            <dt>Email</dt>
            <dd>{candidate.email}</dd>
            <dt>Phone</dt>
            <dd>{candidate.profile?.phone ?? "Not submitted"}</dd>
            <dt>Location</dt>
            <dd>{candidate.profile?.location ?? "Not submitted"}</dd>
            <dt>Current role</dt>
            <dd>{candidate.profile?.currentRole ?? "Not submitted"}</dd>
            <dt>Notice period</dt>
            <dd>{candidate.profile?.noticePeriod ?? "Not submitted"}</dd>
            <dt>Salary expectation</dt>
            <dd>{candidate.profile?.salaryExpectation ?? "Not submitted"}</dd>
            <dt>LinkedIn</dt>
            <dd>
              {candidate.profile?.linkedinUrl ? (
                <a href={candidate.profile.linkedinUrl}>{candidate.profile.linkedinUrl}</a>
              ) : (
                "Not submitted"
              )}
            </dd>
          </dl>
          {candidate.resume ? (
            <p>
              <a className="button secondary" href={candidate.resume.path} download>
                <Download size={16} /> Download resume
              </a>
            </p>
          ) : null}
        </section>

        <section className="panel" style={{ padding: 24 }}>
          <h2>Timeline</h2>
          {candidate.timeline
            .slice()
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map((item) => (
              <article key={item.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                <strong>{item.title}</strong>
                <p className="muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</p>
                {item.description ? <p>{item.description}</p> : null}
              </article>
            ))}
        </section>
      </div>
    </AppShell>
  );
}
