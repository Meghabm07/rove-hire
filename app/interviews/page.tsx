import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { isSignedIn } from "@/lib/auth";
import { readStore } from "@/lib/data";

export default async function InterviewsPage() {
  if (!(await isSignedIn())) redirect("/signin");

  const store = await readStore();

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1>Interviews</h1>
          <p className="muted">Upcoming and completed interviews sorted by date.</p>
        </div>
      </div>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Candidate</th>
              <th>Role</th>
              <th>Type</th>
              <th>Interviewer</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {store.interviews.map((interview) => (
              <tr key={interview.id}>
                <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(interview.scheduledAt))}</td>
                <td>
                  <Link href={`/candidates/${interview.candidateId}`}>
                    <strong>{interview.candidateName}</strong>
                  </Link>
                </td>
                <td>{interview.roleTitle}</td>
                <td>{interview.type}</td>
                <td>{interview.interviewerName}</td>
                <td>{interview.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
