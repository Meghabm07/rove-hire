import { CandidateStatus } from "@/lib/types";
import { statusClass } from "@/lib/data";

export function StatusPill({ status }: { status: CandidateStatus }) {
  return <span className={`status-pill ${statusClass(status)}`}>{status}</span>;
}
