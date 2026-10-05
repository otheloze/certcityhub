import { QuestionType } from "./enums";

// The shape of Question.answerSchema varies by Question.type. Correctness for
// choice-based types lives on QuestionOption.isCorrect, not in this schema.

export interface ChoiceAnswerSchema {
  allowPartialCredit: boolean;
}

export interface NumericAnswerSchema {
  correctValue: number;
  tolerance: number;
  unit?: string;
}

export type ShortAnswerMatchType = "exact" | "contains" | "regex";

export interface ShortAnswerAnswerSchema {
  acceptedAnswers: string[];
  caseSensitive: boolean;
  matchType: ShortAnswerMatchType;
}

export type AnswerSchemaFor<T extends QuestionType> = T extends
  | QuestionType.SINGLE_CHOICE
  | QuestionType.MULTIPLE_CHOICE
  | QuestionType.TRUE_FALSE
  ? ChoiceAnswerSchema
  : T extends QuestionType.NUMERIC
    ? NumericAnswerSchema
    : T extends QuestionType.SHORT_ANSWER
      ? ShortAnswerAnswerSchema
      : never;

export type AnswerSchema =
  | ChoiceAnswerSchema
  | NumericAnswerSchema
  | ShortAnswerAnswerSchema;
