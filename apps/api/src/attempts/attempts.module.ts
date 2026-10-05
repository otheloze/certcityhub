import { Module } from "@nestjs/common";
import { ScoringModule } from "../scoring/scoring.module";
import { CreditsModule } from "../credits/credits.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { TutorsModule } from "../tutors/tutors.module";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";

@Module({
  imports: [ScoringModule, CreditsModule, OrganizationsModule, TutorsModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
