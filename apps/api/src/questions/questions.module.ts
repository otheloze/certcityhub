import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { QuestionStatusService } from "./question-status.service";

@Module({
  imports: [AuditModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionStatusService],
  exports: [QuestionsService, QuestionStatusService],
})
export class QuestionsModule {}
