import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, User, Mail, Phone, MapPin, Briefcase, Clock, DollarSign, Linkedin, FileText, CalendarDays, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
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

  const initials = candidate.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell>
      <style>{`
        .cp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--muted, #6b7280);
          text-decoration: none;
          margin-bottom: 20px;
          transition: color 0.15s;
        }
        .cp-back:hover { color: var(--foreground, #111); }

        /* Hero header */
        .cp-hero {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .cp-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          letter-spacing: 0.5px;
        }
        .cp-hero-info { flex: 1; min-width: 0; }
        .cp-hero-info h1 {
          margin: 0 0 4px;
          font-size: 26px;
          font-weight: 700;
          color: var(--foreground, #111);
          line-height: 1.2;
        }
        .cp-hero-info p {
          margin: 0;
          font-size: 14px;
          color: var(--muted, #6b7280);
        }
        .cp-hero-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

        /* Layout grid */
        .cp-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .cp-layout { grid-template-columns: 1fr; }
        }

        /* Cards */
        .cp-card {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
        }
        .cp-card-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--line, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cp-card-header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--muted, #6b7280);
        }
        .cp-card-body { padding: 20px; }

        /* Profile fields */
        .cp-profile-field {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line, #e5e7eb);
        }
        .cp-profile-field:last-child { border-bottom: none; padding-bottom: 0; }
        .cp-profile-field:first-child { padding-top: 0; }
        .cp-field-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--surface, #f9fafb);
          border: 1px solid var(--line, #e5e7eb);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--muted, #6b7280);
        }
        .cp-field-content { flex: 1; min-width: 0; }
        .cp-field-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted, #9ca3af);
          margin-bottom: 2px;
        }
        .cp-field-value {
          font-size: 14px;
          color: var(--foreground, #111);
          word-break: break-word;
        }
        .cp-field-value.empty { color: var(--muted, #9ca3af); font-style: italic; }

        /* Resume download */
        .cp-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid var(--line, #e5e7eb);
          background: var(--surface, #f9fafb);
          font-size: 13px;
          font-weight: 500;
          color: var(--foreground, #111);
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s;
          width: 100%;
          justify-content: center;
        }
        .cp-download-btn:hover {
          background: var(--line, #e5e7eb);
          border-color: #d1d5db;
        }

        /* Offer docs */
        .cp-offer-doc {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid var(--line, #e5e7eb);
          background: var(--surface, #f9fafb);
          font-size: 13px;
          font-weight: 500;
          color: var(--foreground, #111);
          text-decoration: none;
          transition: background 0.15s;
        }
        .cp-offer-doc:hover { background: var(--line, #e5e7eb); }
        .cp-offer-doc span { flex: 1; }

        /* Right column tabs / sections */
        .cp-sections { display: flex; flex-direction: column; gap: 20px; }

        /* Action forms */
        .cp-action-section {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
        }
        .cp-action-toggle {
          width: 100%;
          padding: 14px 20px;
          background: none;
          border: none;
          border-bottom: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground, #111);
          text-align: left;
          transition: background 0.15s;
        }
        .cp-action-toggle:hover { background: var(--surface, #f9fafb); }
        .cp-action-toggle.open { border-bottom-color: var(--line, #e5e7eb); }
        .cp-action-body { padding: 20px; display: grid; gap: 12px; }
        .cp-action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        /* Form elements */
        .cp-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted, #6b7280);
          margin-bottom: 4px;
          display: block;
          letter-spacing: 0.03em;
        }
        .cp-field-group { display: flex; flex-direction: column; }

        /* Primary / danger buttons */
        .cp-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 8px;
          background: #6366f1;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          width: 100%;
        }
        .cp-btn-primary:hover { background: #4f46e5; }
        .cp-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .cp-btn-success {
          background: #059669;
        }
        .cp-btn-success:hover { background: #047857; }
        .cp-btn-danger {
          background: #dc2626;
        }
        .cp-btn-danger:hover { background: #b91c1c; }
        .cp-btn-secondary {
          background: var(--surface, #f9fafb);
          border: 1px solid var(--line, #e5e7eb);
          color: var(--foreground, #111);
        }
        .cp-btn-secondary:hover { background: var(--line, #e5e7eb); }

        /* Interviews */
        .cp-interview-card {
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .cp-interview-card:last-child { margin-bottom: 0; }
        .cp-interview-head {
          padding: 14px 16px;
          background: var(--surface, #f9fafb);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .cp-interview-title { font-size: 14px; font-weight: 600; color: var(--foreground, #111); }
        .cp-interview-meta { font-size: 12px; color: var(--muted, #6b7280); margin-top: 2px; }
        .cp-interview-body { padding: 14px 16px; display: grid; gap: 10px; }
        .cp-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
        }
        .cp-badge-hire { background: #d1fae5; color: #065f46; }
        .cp-badge-maybe { background: #fef3c7; color: #92400e; }
        .cp-badge-nohire { background: #fee2e2; color: #991b1b; }
        .cp-feedback-text { font-size: 13px; color: var(--foreground, #111); line-height: 1.5; }

        /* Timeline */
        .cp-timeline { position: relative; padding-left: 20px; }
        .cp-timeline::before {
          content: "";
          position: absolute;
          left: 7px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: var(--line, #e5e7eb);
          border-radius: 1px;
        }
        .cp-timeline-item {
          position: relative;
          padding: 0 0 20px 16px;
        }
        .cp-timeline-item:last-child { padding-bottom: 0; }
        .cp-timeline-dot {
          position: absolute;
          left: -13px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6366f1;
          border: 2px solid var(--card, #fff);
          box-shadow: 0 0 0 1px #6366f1;
        }
        .cp-timeline-title { font-size: 14px; font-weight: 600; color: var(--foreground, #111); }
        .cp-timeline-date { font-size: 12px; color: var(--muted, #6b7280); margin: 2px 0 4px; }
        .cp-timeline-desc { font-size: 13px; color: var(--muted, #6b7280); line-height: 1.5; }

        /* Terminal state banner */
        .cp-terminal-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .cp-terminal-hired { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .cp-terminal-rejected { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

        /* Empty states */
        .cp-empty {
          text-align: center;
          padding: 32px 20px;
          color: var(--muted, #9ca3af);
          font-size: 14px;
        }

        .cp-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #9ca3af);
          margin: 0 0 12px;
        }
      `}</style>

      {/* Back nav */}
      <Link className="cp-back" href="/">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-avatar">{initials}</div>
        <div className="cp-hero-info">
          <h1>{candidate.name}</h1>
          <p>{job?.title ?? "Unknown role"} · {candidate.email}</p>
        </div>
        <div className="cp-hero-actions">
          <StatusPill status={candidate.status} />
        </div>
      </div>

      {/* Terminal banner */}
      {candidate.status === "Hired" && (
        <div className="cp-terminal-banner cp-terminal-hired">
          <CheckCircle2 size={18} />
          This candidate has been hired. No further actions are available.
        </div>
      )}
      {candidate.status === "Rejected" && (
        <div className="cp-terminal-banner cp-terminal-rejected">
          <XCircle size={18} />
          This candidate has been rejected. No further actions are available.
        </div>
      )}

      <div className="cp-layout">
        {/* ── Left column: Profile info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div className="cp-card">
            <div className="cp-card-header">
              <h2>Candidate profile</h2>
            </div>
            <div className="cp-card-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
              {[
                { icon: <Mail size={14} />, label: "Email", value: candidate.email },
                { icon: <Phone size={14} />, label: "Phone", value: candidate.profile?.phone },
                { icon: <MapPin size={14} />, label: "Location", value: candidate.profile?.location },
                { icon: <Briefcase size={14} />, label: "Current role", value: candidate.profile?.currentRole },
                { icon: <Clock size={14} />, label: "Notice period", value: candidate.profile?.noticePeriod },
                { icon: <DollarSign size={14} />, label: "Salary expectation", value: candidate.profile?.salaryExpectation },
              ].map(({ icon, label, value }) => (
                <div className="cp-profile-field" key={label}>
                  <div className="cp-field-icon">{icon}</div>
                  <div className="cp-field-content">
                    <div className="cp-field-label">{label}</div>
                    <div className={`cp-field-value${!value ? " empty" : ""}`}>
                      {value ?? "Not provided"}
                    </div>
                  </div>
                </div>
              ))}
              {/* LinkedIn */}
              <div className="cp-profile-field">
                <div className="cp-field-icon"><Linkedin size={14} /></div>
                <div className="cp-field-content">
                  <div className="cp-field-label">LinkedIn</div>
                  <div className={`cp-field-value${!candidate.profile?.linkedinUrl ? " empty" : ""}`}>
                    {candidate.profile?.linkedinUrl
                      ? <a href={candidate.profile.linkedinUrl} style={{ color: "#6366f1" }}>View profile</a>
                      : "Not provided"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          {(candidate.resume || candidate.offerDocuments?.length) && (
            <div className="cp-card">
              <div className="cp-card-header">
                <h2>Documents</h2>
              </div>
              <div className="cp-card-body" style={{ display: "grid", gap: 10 }}>
                {candidate.resume && (
                  <a className="cp-download-btn" href={fileUrl(candidate.resume.path)} download>
                    <FileText size={15} /> Download resume
                  </a>
                )}
                {candidate.offerDocuments?.map((doc) => (
                  <a key={doc.id} className="cp-offer-doc" href={fileUrl(doc.path)} download>
                    <Download size={14} />
                    <span>{doc.type}</span>
                    <ChevronRight size={14} style={{ color: "var(--muted, #9ca3af)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: Actions + Interviews + Timeline ── */}
        <div className="cp-sections">

          {/* Actions */}
          {!terminal && (
            <div className="cp-card">
              <div className="cp-card-header">
                <h2>Actions</h2>
              </div>
              <div className="cp-card-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Schedule interview */}
                <div>
                  <p className="cp-section-title">Schedule interview</p>
                  <form action={scheduleAction} style={{ display: "grid", gap: 12 }}>
                    <div className="cp-action-row">
                      <div className="cp-field-group">
                        <label className="cp-label">Date</label>
                        <input className="input" name="date" type="date" required />
                      </div>
                      <div className="cp-field-group">
                        <label className="cp-label">Time</label>
                        <input className="input" name="time" type="time" required />
                      </div>
                    </div>
                    <div className="cp-action-row">
                      <div className="cp-field-group">
                        <label className="cp-label">Interview type</label>
                        <select className="select" name="type" defaultValue="Screening">
                          <option value="Screening">Screening</option>
                          <option value="Technical">Technical</option>
                        </select>
                      </div>
                      <div className="cp-field-group">
                        <label className="cp-label">Interviewer name</label>
                        <input className="input" name="interviewerName" placeholder="e.g. Jane Doe" required />
                      </div>
                    </div>
                    <div className="cp-field-group">
                      <label className="cp-label">Notes (optional)</label>
                      <textarea className="textarea" name="notes" placeholder="Any prep notes or context…" style={{ minHeight: 72 }} />
                    </div>
                    <button className="cp-btn-primary" type="submit">
                      <CalendarDays size={15} /> Schedule interview
                    </button>
                  </form>
                </div>

                {/* Generate offer */}
                {canGenerateOffer && (
                  <>
                    <hr style={{ border: "none", borderTop: "1px solid var(--line, #e5e7eb)", margin: 0 }} />
                    <div>
                      <p className="cp-section-title">Generate offer documents</p>
                      <form action={offerAction} style={{ display: "grid", gap: 12 }}>
                        <div className="cp-field-group">
                          <label className="cp-label">Role title</label>
                          <input className="input" name="roleTitle" defaultValue={job?.title ?? ""} placeholder="e.g. Senior Engineer" required />
                        </div>
                        <div className="cp-action-row">
                          <div className="cp-field-group">
                            <label className="cp-label">Currency</label>
                            <select className="select" name="currency" defaultValue="USD">
                              <option value="USD">USD</option>
                              <option value="INR">INR</option>
                              <option value="CAD">CAD</option>
                            </select>
                          </div>
                          <div className="cp-field-group">
                            <label className="cp-label">Amount</label>
                            <input className="input" name="amount" placeholder="e.g. 120000" required />
                          </div>
                        </div>
                        <div className="cp-action-row">
                          <div className="cp-field-group">
                            <label className="cp-label">Start date</label>
                            <input className="input" name="startDate" type="date" required />
                          </div>
                          <div className="cp-field-group">
                            <label className="cp-label">Reporting manager</label>
                            <input className="input" name="reportingManager" placeholder="e.g. John Smith" required />
                          </div>
                        </div>
                        <div className="cp-field-group">
                          <label className="cp-label">Work location</label>
                          <input className="input" name="location" placeholder="e.g. New York / Remote" required />
                        </div>
                        <button className="cp-btn-primary" type="submit">
                          <FileText size={15} /> Generate PDFs
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {/* Hire / Reject */}
                <hr style={{ border: "none", borderTop: "1px solid var(--line, #e5e7eb)", margin: 0 }} />
                <div style={{ display: "grid", gap: 12 }}>
                  <p className="cp-section-title">Final decision</p>
                  <form action={hireAction}>
                    <button
                      className={`cp-btn-primary cp-btn-success`}
                      type="submit"
                      disabled={!canHire}
                      title={!canHire ? "Generate offer documents first" : undefined}
                    >
                      <CheckCircle2 size={15} />
                      {canHire ? "Mark as hired" : "Generate offer docs to hire"}
                    </button>
                  </form>
                  <form action={rejectAction} style={{ display: "grid", gap: 10 }}>
                    <div className="cp-field-group">
                      <label className="cp-label">Rejection reason</label>
                      <textarea className="textarea" name="reason" placeholder="Briefly explain why this candidate isn't moving forward…" required style={{ minHeight: 72 }} />
                    </div>
                    <button className="cp-btn-primary cp-btn-danger" type="submit">
                      <XCircle size={15} /> Mark as rejected
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Interviews */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h2>Interviews</h2>
              <span style={{ fontSize: 13, color: "var(--muted, #6b7280)" }}>
                {interviews.length} {interviews.length === 1 ? "session" : "sessions"}
              </span>
            </div>
            <div className="cp-card-body">
              {interviews.length ? (
                interviews.map((interview) => {
                  const completeAction = completeInterviewAction.bind(null, candidate.id);
                  const recMap: Record<string, string> = {
                    Hire: "cp-badge-hire",
                    Maybe: "cp-badge-maybe",
                    "No Hire": "cp-badge-nohire",
                  };
                  return (
                    <div key={interview.id} className="cp-interview-card">
                      <div className="cp-interview-head">
                        <div>
                          <div className="cp-interview-title">
                            {interview.type} · {interview.interviewerName}
                          </div>
                          <div className="cp-interview-meta">
                            {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(interview.scheduledAt))}
                          </div>
                        </div>
                        {interview.status === "Completed" && interview.recommendation ? (
                          <span className={`cp-badge ${recMap[interview.recommendation] ?? ""}`}>
                            {interview.recommendation}
                          </span>
                        ) : (
                          <span className="cp-badge" style={{ background: "var(--surface, #f3f4f6)", color: "var(--muted, #6b7280)" }}>
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="cp-interview-body">
                        {interview.notes && (
                          <p className="cp-feedback-text" style={{ color: "var(--muted, #6b7280)" }}>{interview.notes}</p>
                        )}
                        {interview.status === "Completed" ? (
                          <p className="cp-feedback-text">{interview.feedbackNote}</p>
                        ) : (
                          <form action={completeAction} style={{ display: "grid", gap: 10 }}>
                            <input type="hidden" name="interviewId" value={interview.id} />
                            <div className="cp-field-group">
                              <label className="cp-label">Recommendation</label>
                              <select className="select" name="recommendation" defaultValue="Hire">
                                <option value="Hire">Hire</option>
                                <option value="Maybe">Maybe</option>
                                <option value="No Hire">No Hire</option>
                              </select>
                            </div>
                            <div className="cp-field-group">
                              <label className="cp-label">Feedback</label>
                              <textarea className="textarea" name="feedbackNote" placeholder="Share interview notes and key observations…" required style={{ minHeight: 80 }} />
                            </div>
                            <button className="cp-btn-primary cp-btn-secondary" type="submit">
                              Save feedback
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="cp-empty">No interviews scheduled yet.</div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="cp-card">
            <div className="cp-card-header">
              <h2>Activity timeline</h2>
            </div>
            <div className="cp-card-body">
              <div className="cp-timeline">
                {candidate.timeline
                  .slice()
                  .sort((a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt))
                  .map((item: { id: string; title: string; createdAt: string; description?: string }) => (
                    <div key={item.id} className="cp-timeline-item">
                      <div className="cp-timeline-dot" />
                      <div className="cp-timeline-title">{item.title}</div>
                      <div className="cp-timeline-date">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
                      </div>
                      {item.description && (
                        <div className="cp-timeline-desc">{item.description}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}