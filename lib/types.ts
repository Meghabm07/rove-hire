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

export type InterviewType = "Screening" | "Technical";
export type InterviewStatus = "Scheduled" | "Completed";
export type InterviewRecommendation = "Hire" | "No Hire" | "Maybe";

export type Interview = {
  id: string;
  candidateId: string;
  candidateName?: string;
  roleTitle?: string;
  scheduledAt: string;
  type: InterviewType;
  interviewerName: string;
  notes?: string;
  status: InterviewStatus;
  recommendation?: InterviewRecommendation;
  feedbackNote?: string;
  completedAt?: string;
  createdAt: string;
};

export type OfferDocument = {
  id: string;
  candidateId: string;
  type: "Offer Letter" | "NDA";
  fileName: string;
  path: string;
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
  offerDocuments?: OfferDocument[];
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
  interviews: Interview[];
};
