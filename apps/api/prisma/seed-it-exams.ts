import { ExamSeed } from "./seed-helpers";
import { APLUS_HARDWARE_NETWORKING, APLUS_OPERATING_SYSTEMS, APLUS_SECURITY_TROUBLESHOOTING } from "./bank-comptia-a-plus";
import { CISM_GOVERNANCE, CISM_RISK_MANAGEMENT, CISM_PROGRAM_INCIDENT } from "./bank-cism";

// Original practice content. Not affiliated with or endorsed by CompTIA or ISACA.

const base = { category: "IT", durationMinutes: 20 };

export const IT_EXAMS: ExamSeed[] = [
  {
    ...base,
    slug: "comptia-a-plus",
    title: "CompTIA A+ Practice",
    shortCode: "A+",
    provider: "CompTIA (unofficial)",
    level: "Entry",
    sortOrder: 10,
    description:
      "Practice questions in the style of CompTIA A+ covering hardware, operating systems, security and troubleshooting. Independent content, not affiliated with or endorsed by CompTIA.",
    topics: [
      { title: "Hardware & Networking", questions: APLUS_HARDWARE_NETWORKING },
      { title: "Operating Systems", questions: APLUS_OPERATING_SYSTEMS },
      { title: "Security & Troubleshooting", questions: APLUS_SECURITY_TROUBLESHOOTING },
    ],
  },
  {
    ...base,
    slug: "cism",
    title: "CISM Practice",
    shortCode: "CISM",
    provider: "ISACA-style (unofficial)",
    level: "Professional",
    sortOrder: 11,
    description:
      "Practice questions in the style of the Certified Information Security Manager (CISM) covering governance, risk and incident management. Independent content, not affiliated with or endorsed by ISACA.",
    topics: [
      { title: "Information Security Governance", questions: CISM_GOVERNANCE },
      { title: "Information Risk Management", questions: CISM_RISK_MANAGEMENT },
      { title: "Incident Management & Programme Development", questions: CISM_PROGRAM_INCIDENT },
    ],
  },
];
