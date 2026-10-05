import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ExamsModule } from "./exams/exams.module";
import { TopicsModule } from "./topics/topics.module";
import { QuestionsModule } from "./questions/questions.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { CreditsModule } from "./credits/credits.module";
import { AuditModule } from "./audit/audit.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { TutorsModule } from "./tutors/tutors.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ExamsModule,
    TopicsModule,
    QuestionsModule,
    AttemptsModule,
    CreditsModule,
    AuditModule,
    OrganizationsModule,
    TutorsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
