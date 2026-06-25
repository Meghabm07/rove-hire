"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { CandidateStatus } from "@/lib/types";

const statuses: Array<CandidateStatus | "All"> = [
  "All",
  "Applied",
  "Form Submitted",
  "Interview Scheduled",
  "Offer Sent",
  "Hired",
  "Rejected",
];

export function CandidateFilters({
  defaultQuery,
  defaultStatus,
}: {
  defaultQuery: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="cf-toolbar">
      <div className="cf-search-wrap">
        <input
          className="input cf-search-input"
          type="search"
          placeholder="Search name or role…"
          defaultValue={defaultQuery}
          onChange={(e) => updateParam("q", e.target.value)}
        />
        {isPending && (
          <span className="cf-spinner">
            <Loader2 size={14} />
          </span>
        )}

         <select
        className="select cf-select"
        defaultValue={defaultStatus}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s === "All" ? "All statuses" : s}
          </option>
        ))}
      </select>
      </div>

     
    </div>
  );
}
