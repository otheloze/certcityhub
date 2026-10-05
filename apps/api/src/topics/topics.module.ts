import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { TopicsController } from "./topics.controller";
import { TopicsService } from "./topics.service";

@Module({
  imports: [AuditModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
