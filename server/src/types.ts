export type CandidateStatus =
  | "Applied"
  | "Form Submitted"
  | "Interview Scheduled"
  | "Offer Sent"
  | "Hired"
  | "Rejected";

export type JobStatus = "Open" | "Closed";

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
};

export type Candidate = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  status: CandidateStatus;
  lastActivityAt: string;
  resume?: {
    fileName: string;
    path: string;
    size: number;
  };
  magicLinkToken?: string;
  magicLinkExpiresAt?: string;
  magicLinkUsedAt?: string;
  profile?: {
    phone?: string;
    location?: string;
    currentRole?: string;
    noticePeriod?: string;
    salaryExpectation?: string;
    linkedinUrl?: string;
  };
  rejectionReason?: string;
  timeline: TimelineEvent[];
};

export type JobOpening = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  status: JobStatus;
  createdAt: string;
};

export type Store = {
  jobs: JobOpening[];
  candidates: Candidate[];
};
