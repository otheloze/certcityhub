export enum Role {
  STUDENT = "STUDENT",
  ADMIN = "ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  TUTOR = "TUTOR",
}

export enum ExamStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum ExamVersionStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum TopicStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}

// Additive-only: new question types are added here, never by adding a new table
// or branching on exam identity in application code.
export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  NUMERIC = "NUMERIC",
  SHORT_ANSWER = "SHORT_ANSWER",
}

export enum QuestionStatus {
  DRAFT = "DRAFT",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  PUBLISHED = "PUBLISHED",
  RETIRED = "RETIRED",
}

// Deliberately just three states for Sprint 2 - grading/analysis states
// (GRADING, GRADED, ANALYZED) are introduced in the scoring sprint.
export enum AttemptStatus {
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  EXPIRED = "EXPIRED",
}

// Legal question status transitions. Enforced server-side by QuestionStatusService;
// never inferred from the client-supplied target status alone.
export const QUESTION_STATUS_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  [QuestionStatus.DRAFT]: [QuestionStatus.IN_REVIEW],
  [QuestionStatus.IN_REVIEW]: [QuestionStatus.APPROVED, QuestionStatus.DRAFT],
  [QuestionStatus.APPROVED]: [QuestionStatus.PUBLISHED, QuestionStatus.DRAFT],
  [QuestionStatus.PUBLISHED]: [QuestionStatus.RETIRED],
  [QuestionStatus.RETIRED]: [],
};
