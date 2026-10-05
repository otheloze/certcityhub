// The credit system depends on this interface only, never on a specific
// payment vendor, so a real provider can replace the sandbox one without
// touching billing or exam logic.

export interface ChargeRequest {
  userId: string;
  amountCents: number;
  currency: string;
  description: string;
}

export interface PaymentResult {
  ok: boolean;
  providerRef?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  charge(request: ChargeRequest): Promise<PaymentResult>;
  refund(providerRef: string, amountCents: number): Promise<PaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
