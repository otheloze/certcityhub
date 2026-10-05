import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CatalogueController } from "./catalogue.controller";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { ExamVersionsController } from "./exam-versions.controller";
import { ExamVersionsService } from "./exam-versions.service";

@Module({
  imports: [AuditModule],
  controllers: [ExamsController, ExamVersionsController, CatalogueController],
  providers: [ExamsService, ExamVersionsService],
  exports: [ExamsService, ExamVersionsService],
})
export class ExamsModule {}
