import Link from "next/link";
import { BriefcaseBusiness, LayoutDashboard, LogOut, UsersRound } from "lucide-react";
import { signOutAction } from "@/app/actions";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <span className="brand-square">R</span>
          <span>ROVE Hire</span>
        </div>
        <nav className="nav" aria-label="Main navigation">
          <Link href="/">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link href="/jobs">
            <BriefcaseBusiness size={18} /> Jobs
          </Link>
          <Link href="/candidates/new">
            <UsersRound size={18} /> Add Candidate
          </Link>
          <form action={signOutAction}>
            <button type="submit">
              <LogOut size={18} /> Sign out
            </button>
          </form>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
