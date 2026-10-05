import { ExamStatus, ExamVersionStatus, QuestionStatus, QuestionType, Role, TopicStatus } from "./enums";

export interface AuthUserDto {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface ExamDto {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ExamStatus;
}

export interface ExamVersionConfigDto {
  durationSeconds: number;
  navigation: {
    allowBackNavigation: boolean;
    allowAnswerChanges: boolean;
    allowMarkForReview: boolean;
  };
  scoringStrategy: {
    type: "RAW" | "PERCENTAGE" | "WEIGHTED";
  };
}

export interface ExamVersionDto {
  id: string;
  examId: string;
  versionLabel: string;
  status: ExamVersionStatus;
  config: ExamVersionConfigDto;
  publishedAt: string | null;
}

export interface TopicDto {
  id: string;
  examVersionId: string;
  parentId: string | null;
  title: string;
  slug: string;
  sortOrder: number;
  status: TopicStatus;
  children: TopicDto[];
}

export interface QuestionOptionDto {
  id: string;
  label: string;
  content: unknown;
  isCorrect?: boolean; // omitted for non-admin/student-facing responses in later sprints
  sortOrder: number;
}

export interface QuestionDto {
  id: string;
  examId: string;
  examVersionId: string;
  type: QuestionType;
  title: string | null;
  stem: unknown;
  answerSchema: unknown;
  explanation: unknown | null;
  difficulty: number | null;
  estimatedTimeSeconds: number | null;
  tags: string[];
  status: QuestionStatus;
  version: number;
  options: QuestionOptionDto[];
}
