import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { CreditsModule } from "../credits/credits.module";
import { AuditModule } from "../audit/audit.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    PassportModule,
    CreditsModule,
    AuditModule,
    MailModule,
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 20 }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "dev-only-change-me",
        signOptions: { expiresIn: configService.get<string>("JWT_EXPIRES_IN") ?? "7d" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
