import type { Candidate, JobOpening, Store, TimelineEvent } from "./types.js";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function event(id: string, type: string, title: string, createdAt: string, description?: string): TimelineEvent {
  return { id, type, title, description, createdAt };
}

const jobs: JobOpening[] = [
  {
    id: "job-product-designer",
    title: "Product Designer",
    description: "Own polished end-to-end experiences across ROVE's driver and operations products.",
    requiredSkills: ["Figma", "Systems Thinking", "Prototyping"],
    status: "Open",
    createdAt: daysAgo(20)
  },
  {
    id: "job-full-stack",
    title: "Full-Stack Developer",
    description: "Build internal tools and customer-facing surfaces with a strong product mindset.",
    requiredSkills: ["Next.js", "TypeScript", "APIs"],
    status: "Open",
    createdAt: daysAgo(18)
  },
  {
    id: "job-ops-manager",
    title: "Operations Manager",
    description: "Coordinate hardware logistics, partner operations, and launch readiness.",
    requiredSkills: ["Vendor Management", "Analytics", "Process Design"],
    status: "Closed",
    createdAt: daysAgo(42)
  }
];

const candidates: Candidate[] = [
  {
    id: "cand-ana",
    jobId: "job-full-stack",
    name: "Ana Martinez",
    email: "ana@example.com",
    status: "Applied",
    lastActivityAt: daysAgo(1),
    resume: { fileName: "ana-martinez-resume.pdf", path: "/sample-resume.pdf", size: 120000 },
    magicLinkToken: "sample-ana-token",
    magicLinkExpiresAt: daysAgo(-13),
    timeline: [event("evt-ana-1", "applied", "Candidate added", daysAgo(1), "Resume received for Full-Stack Developer.")]
  },
  {
    id: "cand-dev",
    jobId: "job-product-designer",
    name: "Dev Shah",
    email: "dev@example.com",
    status: "Form Submitted",
    lastActivityAt: daysAgo(2),
    resume: { fileName: "dev-shah-resume.pdf", path: "/sample-resume.pdf", size: 132000 },
    magicLinkToken: "sample-dev-token",
    magicLinkExpiresAt: daysAgo(10),
    magicLinkUsedAt: daysAgo(2),
    profile: {
      phone: "+1 555 0142",
      location: "Austin, TX",
      currentRole: "Senior Product Designer",
      noticePeriod: "30 days",
      salaryExpectation: "USD 145,000",
      linkedinUrl: "https://linkedin.com/in/devshah"
    },
    timeline: [
      event("evt-dev-2", "form", "Application form submitted", daysAgo(2)),
      event("evt-dev-1", "applied", "Candidate added", daysAgo(5), "Resume received for Product Designer.")
    ]
  },
  {
    id: "cand-maya",
    jobId: "job-full-stack",
    name: "Maya Chen",
    email: "maya@example.com",
    status: "Interview Scheduled",
    lastActivityAt: daysAgo(0),
    resume: { fileName: "maya-chen-resume.pdf", path: "/sample-resume.pdf", size: 128000 },
    profile: {
      phone: "+1 555 0179",
      location: "Seattle, WA",
      currentRole: "Frontend Engineer",
      noticePeriod: "2 weeks",
      salaryExpectation: "USD 160,000",
      linkedinUrl: "https://linkedin.com/in/mayachen"
    },
    timeline: [
      event("evt-maya-3", "interview", "Technical interview scheduled", daysAgo(0), "With Priya Nair."),
      event("evt-maya-2", "form", "Application form submitted", daysAgo(3)),
      event("evt-maya-1", "applied", "Candidate added", daysAgo(7), "Resume received for Full-Stack Developer.")
    ]
  },
  {
    id: "cand-noah",
    jobId: "job-full-stack",
    name: "Noah Williams",
    email: "noah@example.com",
    status: "Offer Sent",
    lastActivityAt: daysAgo(4),
    resume: { fileName: "noah-williams-resume.pdf", path: "/sample-resume.pdf", size: 140000 },
    timeline: [
      event("evt-noah-3", "offer", "Offer documents generated", daysAgo(4)),
      event("evt-noah-2", "interview", "Screening interview completed", daysAgo(6), "Hire recommendation."),
      event("evt-noah-1", "applied", "Candidate added", daysAgo(12), "Resume received for Full-Stack Developer.")
    ]
  },
  {
    id: "cand-iris",
    jobId: "job-ops-manager",
    name: "Iris Cooper",
    email: "iris@example.com",
    status: "Rejected",
    lastActivityAt: daysAgo(9),
    resume: { fileName: "iris-cooper-resume.pdf", path: "/sample-resume.pdf", size: 99000 },
    rejectionReason: "Role was closed before final interview.",
    timeline: [
      event("evt-iris-2", "rejected", "Candidate rejected", daysAgo(9), "Role was closed before final interview."),
      event("evt-iris-1", "applied", "Candidate added", daysAgo(15), "Resume received for Operations Manager.")
    ]
  }
];

export const seedStore: Store = { jobs, candidates };
