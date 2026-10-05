import { Module } from "@nestjs/common";
import { CreditsModule } from "../credits/credits.module";
import { AuditModule } from "../audit/audit.module";
import { ExamsModule } from "../exams/exams.module";
import { TopicsModule } from "../topics/topics.module";
import { QuestionsModule } from "../questions/questions.module";
import { OrganizationsService } from "./organizations.service";
import { OrganizationsController } from "./organizations.controller";
import { AdminOrganizationsController } from "./admin-organizations.controller";
import { OrgExamsController } from "./org-exams.controller";

@Module({
  imports: [CreditsModule, AuditModule, ExamsModule, TopicsModule, QuestionsModule],
  controllers: [OrganizationsController, AdminOrganizationsController, OrgExamsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
