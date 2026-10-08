import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CreditsController } from "./credits.controller";
import { AdminCreditsController } from "./admin-credits.controller";
import { CreditsService } from "./credits.service";
import { PAYMENT_PROVIDER } from "./payment/payment-provider";
import { SandboxPaymentProvider } from "./payment/sandbox-payment.provider";
import { PaypalService } from "./payment/paypal.service";

@Module({
  imports: [AuditModule],
  controllers: [CreditsController, AdminCreditsController],
  providers: [
    CreditsService,
    PaypalService,
    // Swap this binding for a real provider (Stripe, Paystack, ...) without
    // touching CreditsService or the exam engine.
    { provide: PAYMENT_PROVIDER, useClass: SandboxPaymentProvider },
  ],
  exports: [CreditsService],
})
export class CreditsModule {}
