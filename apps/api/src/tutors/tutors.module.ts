import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TutorsService } from "./tutors.service";
import { TutorsController } from "./tutors.controller";
import { PublicTutorsController } from "./public-tutors.controller";
import { AdminTutorsController } from "./admin-tutors.controller";

@Module({
  imports: [AuditModule],
  controllers: [TutorsController, PublicTutorsController, AdminTutorsController],
  providers: [TutorsService],
  exports: [TutorsService],
})
export class TutorsModule {}
