import { QuestionType } from "@examproject/shared-types";

// Pure grading logic, no DB access - the frozen AttemptQuestion.snapshot
// (with answer keys) plus whatever the student submitted as responseData.
// Never re-reads the live Question, so a later edit/retirement can't change
// a past attempt's grade.

export interface GradableOption {
  id?: string;
  label: string;
  isCorrect: boolean;
}

export interface GradableSnapshot {
  type: QuestionType;
  answerSchema: Record<string, unknown>;
  options?: GradableOption[];
}

export interface GradeResult {
  isCorrect: boolean;
  fraction: number; // 0..1, awarded fraction of this question's points
}

const UNANSWERED: GradeResult = { isCorrect: false, fraction: 0 };

export function gradeAnswer(
  snapshot: GradableSnapshot,
  responseData: Record<string, unknown> | null | undefined,
): GradeResult {
  if (!responseData) {
    return UNANSWERED;
  }

  switch (snapshot.type) {
    case QuestionType.SINGLE_CHOICE:
    case QuestionType.TRUE_FALSE:
      return gradeSingleChoice(snapshot, responseData);
    case QuestionType.MULTIPLE_CHOICE:
      return gradeMultipleChoice(snapshot, responseData);
    case QuestionType.NUMERIC:
      return gradeNumeric(snapshot, responseData);
    case QuestionType.SHORT_ANSWER:
      return gradeShortAnswer(snapshot, responseData);
    default:
      return UNANSWERED;
  }
}

function optionLabelsByLabel(options: GradableOption[] | undefined, label: string) {
  return options?.find((o) => o.label === label);
}

function selectedLabels(responseData: Record<string, unknown>): string[] {
  const raw = responseData.optionLabels ?? responseData.optionLabel;
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string");
  }
  if (typeof raw === "string") {
    return [raw];
  }
  return [];
}

function gradeSingleChoice(snapshot: GradableSnapshot, responseData: Record<string, unknown>): GradeResult {
  const selected = selectedLabels(responseData);
  if (selected.length !== 1) {
    return UNANSWERED;
  }
  const option = optionLabelsByLabel(snapshot.options, selected[0]);
  return option?.isCorrect ? { isCorrect: true, fraction: 1 } : { isCorrect: false, fraction: 0 };
}

function gradeMultipleChoice(snapshot: GradableSnapshot, responseData: Record<string, unknown>): GradeResult {
  const options = snapshot.options ?? [];
  const correctLabels = new Set(options.filter((o) => o.isCorrect).map((o) => o.label));
  const selected = new Set(selectedLabels(responseData));

  if (selected.size === 0 || correctLabels.size === 0) {
    return UNANSWERED;
  }

  const correctSelected = [...selected].filter((label) => correctLabels.has(label)).length;
  const incorrectSelected = selected.size - correctSelected;
  const isExactMatch =
    selected.size === correctLabels.size && correctSelected === correctLabels.size;

  const allowPartialCredit = Boolean(snapshot.answerSchema?.allowPartialCredit);
  if (!allowPartialCredit) {
    return isExactMatch ? { isCorrect: true, fraction: 1 } : { isCorrect: false, fraction: 0 };
  }

  const fraction = Math.max(0, (correctSelected - incorrectSelected) / correctLabels.size);
  return { isCorrect: isExactMatch, fraction };
}

function gradeNumeric(snapshot: GradableSnapshot, responseData: Record<string, unknown>): GradeResult {
  const value = responseData.value;
  if (typeof value !== "number") {
    return UNANSWERED;
  }
  const correctValue = snapshot.answerSchema?.correctValue;
  const tolerance = snapshot.answerSchema?.tolerance;
  if (typeof correctValue !== "number" || typeof tolerance !== "number") {
    return UNANSWERED;
  }
  const isCorrect = Math.abs(value - correctValue) <= tolerance;
  return { isCorrect, fraction: isCorrect ? 1 : 0 };
}

function gradeShortAnswer(snapshot: GradableSnapshot, responseData: Record<string, unknown>): GradeResult {
  const text = responseData.text;
  if (typeof text !== "string") {
    return UNANSWERED;
  }
  const acceptedAnswers = snapshot.answerSchema?.acceptedAnswers;
  const caseSensitive = Boolean(snapshot.answerSchema?.caseSensitive);
  const matchType = (snapshot.answerSchema?.matchType as string) ?? "exact";
  if (!Array.isArray(acceptedAnswers)) {
    return UNANSWERED;
  }

  const normalize = (s: string) => (caseSensitive ? s : s.toLowerCase()).replace(/\s+/g, " ");
  const candidate = normalize(text.trim());

  const isCorrect = acceptedAnswers.some((accepted) => {
    if (typeof accepted !== "string") return false;
    const normalizedAccepted = normalize(accepted);
    switch (matchType) {
      case "contains":
        return candidate.includes(normalizedAccepted);
      case "regex":
        return new RegExp(normalizedAccepted, caseSensitive ? "" : "i").test(text);
      case "exact":
      default:
        return candidate === normalizedAccepted;
    }
  });

  return { isCorrect, fraction: isCorrect ? 1 : 0 };
}
