import { Module } from "@nestjs/common";
import { CreditsModule } from "../credits/credits.module";
import { TutorsModule } from "../tutors/tutors.module";
import { UsersController } from "./users.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [CreditsModule, TutorsModule],
  controllers: [UsersController],
  providers: [DashboardService],
})
export class UsersModule {}
