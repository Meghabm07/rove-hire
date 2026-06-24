"use client";

import { useFormState, useFormStatus } from "react-dom";
import { signInAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending ? "Signing in" : "Sign in"}
    </button>
  );
}

export default function SignInPage() {
  const [state, formAction] = useFormState(signInAction, {});

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">
          <span className="brand-square">R</span>
          <span>ROVE Hire</span>
        </div>
        <h1>Sign in to recruiting</h1>
        <p className="muted">Use the HR credentials to manage the candidate pipeline.</p>
        <form action={formAction}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" defaultValue="hr@rovedashcam.com" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" defaultValue="rovehire" required />
          </div>
          {state.error ? <p className="error">{state.error}</p> : null}
          <SubmitButton />
        </form>
      </section>
    </main>
  );
}
