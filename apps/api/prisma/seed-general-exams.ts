import { ExamSeed } from "./seed-helpers";
import { CPA_FINANCIAL_ACCOUNTING, CPA_AUDITING_ATTESTATION, CPA_ETHICS_TAX_REGULATION } from "./bank-cpa";
import { ACCA_FINANCIAL_REPORTING, ACCA_MANAGEMENT_ACCOUNTING, ACCA_AUDIT_ETHICS } from "./bank-acca";
import { ICAN_FINANCIAL_ACCOUNTING, ICAN_TAXATION_CONCEPTS, ICAN_AUDIT_GOVERNANCE } from "./bank-ican";

// Original practice content. Not affiliated with or endorsed by the AICPA, ACCA
// or ICAN. Concepts are kept general so they stay correct as rules change;
// always check current standards and law for real exams.

const base = { category: "General", durationMinutes: 20 };

export const GENERAL_EXAMS: ExamSeed[] = [
  {
    ...base,
    slug: "cpa-practice",
    title: "Certified Public Accountant (CPA) Practice",
    shortCode: "CPA",
    provider: "US CPA-style (unofficial)",
    level: "Professional",
    sortOrder: 30,
    durationMinutes: 240,
    blueprint: { questionCount: 60, randomize: true },
    description:
      "Practice questions in the style of the US Certified Public Accountant exam covering financial accounting, auditing and ethics. Independent content, not affiliated with or endorsed by the AICPA or any state board.",
    topics: [
      { title: "Financial Accounting & Reporting", questions: CPA_FINANCIAL_ACCOUNTING },
      { title: "Auditing & Attestation", questions: CPA_AUDITING_ATTESTATION },
      { title: "Ethics, Tax & Regulation", questions: CPA_ETHICS_TAX_REGULATION },
    ],
  },
  {
    ...base,
    slug: "acca-practice",
    title: "ACCA Practice",
    shortCode: "ACCA",
    provider: "ACCA-style (unofficial)",
    level: "Professional",
    sortOrder: 31,
    durationMinutes: 120,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Practice questions in the style of the Association of Chartered Certified Accountants (ACCA) qualification covering financial reporting, management accounting and audit and ethics. Independent content, not affiliated with or endorsed by ACCA.",
    topics: [
      { title: "Financial Reporting", questions: ACCA_FINANCIAL_REPORTING },
      { title: "Management Accounting", questions: ACCA_MANAGEMENT_ACCOUNTING },
      { title: "Audit & Ethics", questions: ACCA_AUDIT_ETHICS },
    ],
  },
  {
    ...base,
    slug: "ican-practice",
    title: "ICAN Practice",
    shortCode: "ICAN",
    provider: "ICAN-style (unofficial)",
    level: "Professional",
    sortOrder: 32,
    durationMinutes: 180,
    blueprint: { questionCount: 50, randomize: true },
    description:
      "Practice questions in the style of the Institute of Chartered Accountants of Nigeria (ICAN) covering financial reporting, taxation concepts and audit and governance. Independent content, not affiliated with or endorsed by ICAN.",
    topics: [
      { title: "Financial Accounting & Reporting", questions: ICAN_FINANCIAL_ACCOUNTING },
      { title: "Taxation Concepts", questions: ICAN_TAXATION_CONCEPTS },
      { title: "Audit & Corporate Governance", questions: ICAN_AUDIT_GOVERNANCE },
    ],
  },
];
