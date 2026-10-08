import Constants from "expo-constants";

const API_BASE_URL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? "http://localhost:3001/api";

export interface ExamSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  shortCode: string | null;
  provider: string | null;
  level: string | null;
  sortOrder: number;
}

export interface CatalogueExam extends ExamSummary {
  version: {
    id: string;
    versionLabel: string;
    questionCount: number;
    topicCount: number;
    durationMinutes: number;
  } | null;
}

export interface TopicNode {
  id: string;
  title: string;
  slug: string;
  sortOrder: number;
  status: string;
  questionCount?: number;
  children: TopicNode[];
}

export class ApiError extends Error {
  // status is 0 for network-level failures (server unreachable, etc.) where
  // no HTTP response was ever received - distinct from a real 4xx/5xx.
  // code is an optional machine-readable tag (e.g. "ORG_ACCESS_CODE_REQUIRED")
  // the server includes on some errors so the UI can branch without parsing
  // the human-readable message.
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// A hung upstream must not hang the caller indefinitely, or the app just
// looks frozen on a loading state instead of showing a clear connection error.
const REQUEST_TIMEOUT_MS = 10_000;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    console.error(`apiFetch(${path}) network failure:`, error);
    throw new ApiError("Could not reach the server. Is it running?", 0);
  }
  if (!response.ok) {
    // Prefer the server's own explanation (e.g. "Only DRAFT exam versions can
    // be edited") over a generic status line.
    let detail = "";
    let code: string | undefined;
    try {
      const body = await response.json();
      detail = Array.isArray(body.message) ? body.message.join("; ") : (body.message ?? "");
      code = typeof body.code === "string" ? body.code : undefined;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(detail || `Request to ${path} failed with status ${response.status}`, response.status, code);
  }
  // 200s with no body (rare in this API) would fail .json() - guard defensively.
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export function authFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
}

export function fetchExamCatalogue() {
  return apiFetch<ExamSummary[]>("/exams");
}

export function fetchExamBySlug(slug: string) {
  return apiFetch<ExamSummary>(`/exams/${slug}`);
}

export interface ExamVersionConfig {
  durationSeconds: number;
  navigation: {
    allowBackNavigation: boolean;
    allowAnswerChanges: boolean;
    allowMarkForReview: boolean;
  };
  scoringStrategy: { type: "RAW" | "PERCENTAGE" | "WEIGHTED" };
}

export interface ExamVersionSummary {
  id: string;
  versionLabel: string;
  config: ExamVersionConfig;
  exam?: { id: string; slug: string; title: string };
}

export function fetchPublishedVersions(examId: string) {
  return apiFetch<ExamVersionSummary[]>(`/exams/${examId}/versions`);
}

export function fetchExamVersion(id: string) {
  return apiFetch<ExamVersionSummary>(`/exam-versions/${id}`);
}

export function fetchTopicTree(examVersionId: string) {
  return apiFetch<TopicNode[]>(`/exam-versions/${examVersionId}/topics`);
}

export interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string; role: string };
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function register(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function registerOrganization(organizationName: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register-organization", {
    method: "POST",
    body: JSON.stringify({ organizationName, email, password }),
  });
}

export function registerTutor(displayName: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register-tutor", {
    method: "POST",
    body: JSON.stringify({ displayName, email, password }),
  });
}

export function requestPasswordReset(email: string) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(email: string, code: string, newPassword: string) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, newPassword }),
  });
}

// The API origin without the "/api" path segment, e.g. "http://localhost:3001".
// Uploaded photos/logos are served as plain static files outside the "/api"
// prefix, so a relative photoUrl like "/uploads/tutor-photos/x.png" needs
// this, not API_BASE_URL, to resolve to a full URL.
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface Attempt {
  id: string;
  userId: string;
  examVersionId: string;
  mode: "SIMULATION" | "PRACTICE";
  status: AttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
}

export interface AttemptOption {
  id?: string;
  label: string;
  content: { blocks: { type: string; text?: string }[] };
  sortOrder: number;
}

export interface AttemptQuestionView {
  id: string;
  questionId: string;
  order: number;
  markedForReview: boolean;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "NUMERIC" | "SHORT_ANSWER";
  title: string | null;
  stem: { blocks: { type: string; text?: string }[] };
  answerSchema: Record<string, unknown>;
  options?: AttemptOption[];
  difficulty: number | null;
  estimatedTimeSeconds: number | null;
  tags: string[];
  answer: Record<string, unknown> | null;
}

export interface AttemptResult {
  id: string;
  attemptId: string;
  strategy: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    questions: {
      attemptQuestionId: string;
      questionId: string;
      isCorrect: boolean;
      answered: boolean;
      pointsAwarded: number;
      pointsPossible: number;
    }[];
    topics: { topicId: string; title: string; correct: number; total: number; accuracy: number }[];
  };
  computedAt: string;
  tutorSuggestions: TutorSuggestion[];
}

export interface StartAttemptOptions {
  mode?: "SIMULATION" | "PRACTICE";
  topicId?: string;
  questionCount?: number;
  difficulty?: number;
  accessCode?: string;
}

export function startAttempt(token: string, examVersionId: string, options: StartAttemptOptions = {}) {
  return authFetch<Attempt>(token, "/attempts", {
    method: "POST",
    body: JSON.stringify({ examVersionId, ...options }),
  });
}

export function fetchAttempt(token: string, id: string) {
  return authFetch<Attempt>(token, `/attempts/${id}`);
}

export function fetchAttemptQuestions(token: string, id: string) {
  return authFetch<AttemptQuestionView[]>(token, `/attempts/${id}/questions`);
}

export function saveAttemptAnswer(
  token: string,
  attemptId: string,
  questionId: string,
  responseData: Record<string, unknown>,
) {
  return authFetch(token, `/attempts/${attemptId}/answers/${questionId}`, {
    method: "PUT",
    body: JSON.stringify({ responseData }),
  });
}

export function setAttemptReviewFlag(token: string, attemptId: string, questionId: string, marked: boolean) {
  return authFetch(token, `/attempts/${attemptId}/review/${questionId}`, {
    method: "PUT",
    body: JSON.stringify({ marked }),
  });
}

export function submitAttempt(token: string, id: string) {
  return authFetch<Attempt>(token, `/attempts/${id}/submit`, { method: "POST" });
}

export function fetchAttemptResult(token: string, id: string) {
  return authFetch<AttemptResult>(token, `/attempts/${id}/result`);
}

// ---------------------------------------------------------------------------
// Credits, practice feedback, review
// ---------------------------------------------------------------------------

export interface Product {
  id: string;
  code: string;
  name: string;
  scopeType: "GLOBAL" | "EXAM";
  examId: string | null;
  credits: number;
  priceCents: number;
  currency: string;
  validityDays: number | null;
  questionFraction: number;
  isActive: boolean;
  // True when `credits` is a large practical stand-in for "unlimited" (the
  // ledger has no real unlimited concept) - display "Unlimited", never the
  // raw number, wherever this is true.
  unlimited: boolean;
}

export interface WalletLot {
  id: string;
  scopeType: "GLOBAL" | "EXAM";
  examId: string | null;
  examTitle: string | null;
  granted: number;
  remaining: number;
  expiresAt: string | null;
  questionFraction: number;
  source: "PURCHASE" | "FREE_PLAN" | "ADMIN_GRANT";
  unlimited: boolean;
}

export interface Wallet {
  lots: WalletLot[];
  total: number;
  unlimited: boolean;
  eligible?: { total: number; fullExam: number; limited: number };
}

export interface CreditTransactionView {
  id: string;
  amount: number;
  reason: "GRANT" | "EXAM_STARTED" | "ADMIN_REFUND" | "ADMIN_ADJUSTMENT";
  attemptId: string | null;
  note: string | null;
  createdAt: string;
  lot: { scopeType: string; examId: string | null; source: string };
}

export interface AnswerFeedback {
  isCorrect: boolean;
  fraction: number;
  correct: { optionLabels?: string[]; value?: number; tolerance?: number; acceptedAnswers?: string[] };
  explanation: { blocks: { type: string; text?: string }[] } | null;
}

export interface ReviewQuestion {
  id: string;
  questionId: string;
  order: number;
  markedForReview: boolean;
  type: AttemptQuestionView["type"];
  title: string | null;
  stem: { blocks: { type: string; text?: string }[] };
  options: { label: string; content: { blocks: { type: string; text?: string }[] }; sortOrder: number }[];
  answer: Record<string, unknown> | null;
  pointsAwarded: number;
  pointsPossible: number;
  feedback: AnswerFeedback;
}

export interface AttemptReview {
  attempt: { id: string; status: AttemptStatus; mode: "SIMULATION" | "PRACTICE" };
  score: { rawScore: number; maxScore: number; percentage: number };
  questions: ReviewQuestion[];
}

export function fetchProducts(examId?: string) {
  return apiFetch<Product[]>(`/products${examId ? `?examId=${examId}` : ""}`);
}

export function purchaseProduct(token: string, productId: string) {
  return authFetch<{ purchase: { id: string; status: string }; lot: WalletLot }>(token, "/credits/purchase", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

// Mobile has no PayPal JS SDK popup to drive approval, so it opens
// `approveUrl` in an in-app browser and relies on PayPal redirecting back to
// returnUrl/cancelUrl - unlike the web app, this always sends both.
export function createPaypalOrder(token: string, productId: string, returnUrl: string, cancelUrl: string) {
  return authFetch<{ orderId: string; approveUrl?: string }>(token, "/credits/paypal/create-order", {
    method: "POST",
    body: JSON.stringify({ productId, returnUrl, cancelUrl }),
  });
}

export function capturePaypalOrder(token: string, productId: string, orderId: string) {
  return authFetch<{ purchase: { id: string; status: string }; lot: WalletLot }>(token, "/credits/paypal/capture-order", {
    method: "POST",
    body: JSON.stringify({ productId, orderId }),
  });
}

export function fetchWallet(token: string, examId?: string) {
  return authFetch<Wallet>(token, `/users/me/credits${examId ? `?examId=${examId}` : ""}`);
}

export function fetchTransactions(token: string) {
  return authFetch<CreditTransactionView[]>(token, "/users/me/transactions");
}

export function checkAttemptAnswer(token: string, attemptId: string, questionId: string) {
  return authFetch<AnswerFeedback>(token, `/attempts/${attemptId}/questions/${questionId}/check`, {
    method: "POST",
  });
}

export function fetchAttemptReview(token: string, attemptId: string) {
  return authFetch<AttemptReview>(token, `/attempts/${attemptId}/review`);
}

export function formatPrice(priceCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(priceCents / 100);
}

// ---------------------------------------------------------------------------
// Catalogue & dashboard
// ---------------------------------------------------------------------------

export function fetchCatalogue() {
  return apiFetch<CatalogueExam[]>("/catalogue");
}

export interface TopicStat {
  topicId: string;
  title: string;
  examTitle: string;
  examSlug: string;
  examVersionId: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface DashboardRecommendation {
  kind: "START" | "PRACTICE_TOPIC" | "TAKE_SIMULATION" | "KEEP_GOING";
  title: string;
  detail: string;
  examSlug?: string;
  examVersionId?: string;
  topicId?: string;
}

export interface Dashboard {
  credits: number;
  creditsUnlimited: boolean;
  stats: { simulations: number; practiceSessions: number; questionsAnswered: number; streakDays: number };
  readiness: { percentage: number; basedOn: number } | null;
  recommendation: DashboardRecommendation;
  weakTopics: TopicStat[];
  strongTopics: TopicStat[];
  exams: {
    examId: string;
    slug: string;
    title: string;
    shortCode: string | null;
    category: string;
    simulations: number;
    practiceSessions: number;
    average: number | null;
    best: number | null;
    last: number | null;
  }[];
  recent: {
    id: string;
    mode: "SIMULATION" | "PRACTICE";
    status: AttemptStatus;
    startedAt: string;
    examTitle: string;
    examSlug: string;
    percentage: number | null;
    rawScore: number | null;
    maxScore: number | null;
  }[];
  tutorSuggestions: TutorSuggestion[];
}

export interface TutorSuggestion {
  tutorId: string;
  displayName: string;
  headline: string | null;
  photoUrl: string | null;
  matchedTopic: { topicId: string; title: string; examTitle: string };
}

export function fetchDashboard(token: string) {
  return authFetch<Dashboard>(token, "/users/me/dashboard");
}
