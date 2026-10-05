import { Injectable } from "@nestjs/common";
import { QUESTION_STATUS_TRANSITIONS, QuestionStatus } from "@examproject/shared-types";

// Pure logic, no DB access, so the transition graph is unit-testable in isolation.
@Injectable()
export class QuestionStatusService {
  isTransitionAllowed(from: QuestionStatus, to: QuestionStatus): boolean {
    return QUESTION_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }
}
