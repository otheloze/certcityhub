import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ChargeRequest, PaymentProvider, PaymentResult } from "./payment-provider";

// Sandbox provider: approves every charge without moving any money. It exists
// so the whole purchase -> credit -> attempt flow is usable before a real
// provider is integrated. Never register this in production.
@Injectable()
export class SandboxPaymentProvider implements PaymentProvider {
  readonly name = "sandbox";

  async charge(_request: ChargeRequest): Promise<PaymentResult> {
    return { ok: true, providerRef: `sandbox_${randomUUID()}` };
  }

  async refund(providerRef: string, _amountCents: number): Promise<PaymentResult> {
    return { ok: true, providerRef: `${providerRef}_refund` };
  }
}
