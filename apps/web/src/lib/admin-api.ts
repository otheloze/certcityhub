import { authFetch, ExamSummary, Product, TopicNode } from "./api-client";

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  credits: number;
  lots: { id: string; scopeType: "GLOBAL" | "EXAM"; examId: string | null; remaining: number }[];
}

export interface AdminAttempt {
  id: string;
  mode: "SIMULATION" | "PRACTICE";
  status: string;
  startedAt: string;
  examTitle: string;
  versionLabel: string;
  creditConsumed: boolean;
  refunded: boolean;
}

export interface AdminVersion {
  id: string;
  examId: string;
  versionLabel: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  config: {
    durationSeconds: number;
    navigation: { allowBackNavigation: boolean; allowAnswerChanges: boolean; allowMarkForReview: boolean };
    scoringStrategy: { type: string };
    blueprint?: { questionCount: number; randomize: boolean };
  };
  exam?: { id: string; slug: string; title: string };
}

export type QuestionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "RETIRED";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "NUMERIC" | "SHORT_ANSWER";

export interface AdminQuestion {
  id: string;
  type: QuestionType;
  title: string | null;
  stem: { blocks: { type: string; text?: string }[] };
  status: QuestionStatus;
  difficulty: number | null;
  version: number;
  options: { label: string; isCorrect: boolean; content: { blocks: { text?: string }[] } }[];
  questionTopics: { isPrimary: boolean; topic: { id: string; title: string } }[];
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
  createdAt: string;
}

const post = <T>(token: string, path: string, body?: unknown) =>
  authFetch<T>(token, path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T>(token: string, path: string, body: unknown) =>
  authFetch<T>(token, path, { method: "PATCH", body: JSON.stringify(body) });

// --- credits & products ---
export const adminSearchUsers = (t: string, search: string) =>
  authFetch<AdminUser[]>(t, `/admin/users?search=${encodeURIComponent(search)}`);
export const adminUserAttempts = (t: string, userId: string) =>
  authFetch<AdminAttempt[]>(t, `/admin/users/${userId}/attempts`);
export const adminGrant = (
  t: string,
  body: {
    userId: string;
    credits: number;
    scopeType: "GLOBAL" | "EXAM";
    examId?: string;
    validityDays?: number;
    questionFraction?: number;
    reason: string;
  },
) => post(t, "/admin/credits/grant", body);
export const adminRefund = (t: string, attemptId: string, reason: string) =>
  post(t, "/admin/credits/refund-attempt", { attemptId, reason });
export const adminAdjust = (t: string, lotId: string, amount: number, reason: string) =>
  post(t, "/admin/credits/adjust", { lotId, amount, reason });
export const adminListProducts = (t: string) => authFetch<Product[]>(t, "/admin/products");
export const adminCreateProduct = (t: string, body: Record<string, unknown>) => post<Product>(t, "/admin/products", body);
export const adminUpdateProduct = (t: string, id: string, body: Record<string, unknown>) =>
  patch<Product>(t, `/admin/products/${id}`, body);

// --- exams, versions, topics ---
export const adminCreateExam = (t: string, body: {
    slug: string;
    title: string;
    description?: string;
    category?: string;
    shortCode?: string;
    provider?: string;
    level?: string;
  },
) => post<ExamSummary>(t, "/exams", body);
export const adminListVersions = (t: string, examId: string) =>
  authFetch<AdminVersion[]>(t, `/exams/${examId}/versions/all`);
export const adminCreateVersion = (t: string, examId: string, body: { versionLabel: string; config: unknown }) =>
  post<AdminVersion>(t, `/exams/${examId}/versions`, body);
export const adminPublishVersion = (t: string, id: string) => post<AdminVersion>(t, `/exam-versions/${id}/publish`);
export const adminGetVersion = (t: string, id: string) => authFetch<AdminVersion>(t, `/admin/exam-versions/${id}`);
export const adminTopicTree = (t: string, versionId: string) =>
  authFetch<TopicNode[]>(t, `/exam-versions/${versionId}/topics?includeArchived=true`);
export const adminCreateTopic = (
  t: string,
  body: { examVersionId: string; parentId?: string; title: string; slug: string; sortOrder?: number },
) => post(t, "/topics", body);

// --- questions ---
export const adminListQuestions = (t: string, examVersionId: string) =>
  authFetch<AdminQuestion[]>(t, `/questions?examVersionId=${examVersionId}`);
export const adminCreateQuestion = (t: string, body: Record<string, unknown>) => post<AdminQuestion>(t, "/questions", body);
export const adminChangeQuestionStatus = (t: string, id: string, targetStatus: QuestionStatus) =>
  post<AdminQuestion>(t, `/questions/${id}/status`, { targetStatus });
export const adminMapTopic = (t: string, questionId: string, topicId: string, isPrimary: boolean) =>
  post(t, `/questions/${questionId}/topics`, { topicId, isPrimary });

// --- audit ---
export const adminAuditLogs = (t: string) => authFetch<AuditEntry[]>(t, "/audit-logs");

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}
