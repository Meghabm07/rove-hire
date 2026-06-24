import { submitApplicationAction } from "@/app/actions";
import { readApplication } from "@/lib/data";

export default async function CandidateApplicationPage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams?: { submitted?: string };
}) {
  if (searchParams?.submitted) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand-mark">
            <span className="brand-square">R</span>
            <span>ROVE Hire</span>
          </div>
          <h1>Application submitted</h1>
          <p className="muted">Thanks for completing your details. The ROVE hiring team will review your application next.</p>
        </section>
      </main>
    );
  }

  const application = await readApplication(params.token);

  if (application.state === "missing" || application.state === "expired" || application.state === "used") {
    const title = application.state === "expired" ? "This link has expired" : application.state === "used" ? "This link was already used" : "Application link not found";
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <div className="brand-mark">
            <span className="brand-square">R</span>
            <span>ROVE Hire</span>
          </div>
          <h1>{title}</h1>
          <p className="muted">Please contact the ROVE hiring team if you need a fresh application link.</p>
        </section>
      </main>
    );
  }

  const action = submitApplicationAction.bind(null, params.token);

  return (
    <main className="auth-shell">
      <section className="auth-card" style={{ width: "min(620px, 100%)" }}>
        <div className="brand-mark">
          <span className="brand-square">R</span>
          <span>ROVE Hire</span>
        </div>
        <h1>Complete your application</h1>
        <p className="muted">
          {application.candidate.name}, please add a few details for the {application.roleTitle} role.
        </p>
        <form action={action}>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input className="input" id="phone" name="phone" required />
          </div>
          <div className="field">
            <label htmlFor="location">Current location</label>
            <input className="input" id="location" name="location" required />
          </div>
          <div className="field">
            <label htmlFor="currentRole">Current role</label>
            <input className="input" id="currentRole" name="currentRole" required />
          </div>
          <div className="field">
            <label htmlFor="noticePeriod">Notice period</label>
            <input className="input" id="noticePeriod" name="noticePeriod" />
          </div>
          <div className="field">
            <label htmlFor="salaryExpectation">Salary expectation</label>
            <input className="input" id="salaryExpectation" name="salaryExpectation" />
          </div>
          <div className="field">
            <label htmlFor="linkedinUrl">LinkedIn URL</label>
            <input className="input" id="linkedinUrl" name="linkedinUrl" type="url" />
          </div>
          <button className="button primary" type="submit">
            Submit application
          </button>
        </form>
      </section>
    </main>
  );
}
