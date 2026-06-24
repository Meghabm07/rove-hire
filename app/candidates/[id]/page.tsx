import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import {
  completeInterviewAction,
  generateOfferAction,
  markHiredAction,
  markRejectedAction,
  scheduleInterviewAction
} from "@/app/actions";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import { isSignedIn } from "@/lib/auth";
import { fileUrl, findJob, readStore } from "@/lib/data";

export default async function CandidateProfilePage({ params }: { params: { id: string } }) {
  if (!(await isSignedIn())) redirect("/signin");

  const store = await readStore();
  const candidate = store.candidates.find((item) => item.id === params.id);
  if (!candidate) notFound();
  const job = findJob(store.jobs, candidate.jobId);
  const interviews = store.interviews.filter((interview) => interview.candidateId === candidate.id);
  const terminal = candidate.status === "Hired" || candidate.status === "Rejected";
  const canGenerateOffer = candidate.status === "Interview Scheduled" || candidate.status === "Offer Sent";
  const canHire = Boolean(candidate.offerDocuments?.length) && !terminal;
  const scheduleAction = scheduleInterviewAction.bind(null, candidate.id);
  const offerAction = generateOfferAction.bind(null, candidate.id);
  const hireAction = markHiredAction.bind(null, candidate.id);
  const rejectAction = markRejectedAction.bind(null, candidate.id);

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
              <a className="button secondary" href={fileUrl(candidate.resume.path)} download>
                <Download size={16} /> Download resume
              </a>
            </p>
          ) : null}

          {candidate.offerDocuments?.length ? (
            <>
              <h3>Offer Documents</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {candidate.offerDocuments.map((document) => (
                  <a key={document.id} className="button secondary" href={fileUrl(document.path)} download>
                    <Download size={16} /> {document.type}
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <section className="panel" style={{ padding: 24 }}>
          <h2>Actions</h2>
          {!terminal ? (
            <form action={scheduleAction} style={{ display: "grid", gap: 12, borderBottom: "1px solid var(--line)", paddingBottom: 18 }}>
              <strong>Schedule interview</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input className="input" name="date" type="date" required />
                <input className="input" name="time" type="time" required />
              </div>
              <select className="select" name="type" defaultValue="Screening">
                <option value="Screening">Screening</option>
                <option value="Technical">Technical</option>
              </select>
              <input className="input" name="interviewerName" placeholder="Interviewer name" required />
              <textarea className="textarea" name="notes" placeholder="Optional notes" />
              <button className="button primary" type="submit">
                Schedule
              </button>
            </form>
          ) : null}

          {canGenerateOffer ? (
            <form action={offerAction} style={{ display: "grid", gap: 12, borderBottom: "1px solid var(--line)", padding: "18px 0" }}>
              <strong>Generate offer documents</strong>
              <input className="input" name="roleTitle" defaultValue={job?.title ?? ""} placeholder="Role title" required />
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10 }}>
                <select className="select" name="currency" defaultValue="USD">
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                </select>
                <input className="input" name="amount" placeholder="Amount" required />
              </div>
              <input className="input" name="startDate" type="date" required />
              <input className="input" name="reportingManager" placeholder="Reporting manager" required />
              <input className="input" name="location" placeholder="Work location" required />
              <button className="button primary" type="submit">
                Generate PDFs
              </button>
            </form>
          ) : null}

          {!terminal ? (
            <div style={{ display: "grid", gap: 12, paddingTop: 18 }}>
              <form action={hireAction}>
                <button className="button primary" type="submit" disabled={!canHire}>
                  Mark as hired
                </button>
              </form>
              <form action={rejectAction} style={{ display: "grid", gap: 10 }}>
                <textarea className="textarea" name="reason" placeholder="Rejection reason" required />
                <button className="button danger" type="submit">
                  Mark as rejected
                </button>
              </form>
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid-two" style={{ marginTop: 20 }}>
        <section className="panel" style={{ padding: 24 }}>
          <h2>Interviews</h2>
          {interviews.length ? (
            interviews.map((interview) => {
              const completeAction = completeInterviewAction.bind(null, candidate.id);
              return (
                <article key={interview.id} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
                  <strong>
                    {interview.type} with {interview.interviewerName}
                  </strong>
                  <p className="muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(interview.scheduledAt))}</p>
                  {interview.notes ? <p>{interview.notes}</p> : null}
                  {interview.status === "Completed" ? (
                    <p>
                      <strong>{interview.recommendation}</strong>: {interview.feedbackNote}
                    </p>
                  ) : (
                    <form action={completeAction} style={{ display: "grid", gap: 10 }}>
                      <input type="hidden" name="interviewId" value={interview.id} />
                      <select className="select" name="recommendation" defaultValue="Hire">
                        <option value="Hire">Hire</option>
                        <option value="Maybe">Maybe</option>
                        <option value="No Hire">No Hire</option>
                      </select>
                      <textarea className="textarea" name="feedbackNote" placeholder="Interview feedback" required />
                      <button className="button secondary" type="submit">
                        Record feedback
                      </button>
                    </form>
                  )}
                </article>
              );
            })
          ) : (
            <p className="muted">No interviews scheduled yet.</p>
          )}
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
